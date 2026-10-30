"""Publica a área cliente e o foco do TL; não envia entradas ao jogo."""
import ctypes as C
from ctypes import wintypes as W
import json
import time


class ProcessEntry(C.Structure):
    _fields_ = [('dwSize', W.DWORD), ('cntUsage', W.DWORD),
                ('th32ProcessID', W.DWORD), ('th32DefaultHeapID', C.c_size_t),
                ('th32ModuleID', W.DWORD), ('cntThreads', W.DWORD),
                ('th32ParentProcessID', W.DWORD), ('pcPriClassBase', W.LONG),
                ('dwFlags', W.DWORD), ('szExeFile', W.WCHAR * 260)]


def watch():
    kernel = C.WinDLL('kernel32', use_last_error=True)
    user = C.WinDLL('user32', use_last_error=True)
    kernel.CreateToolhelp32Snapshot.argtypes = [W.DWORD, W.DWORD]
    kernel.CreateToolhelp32Snapshot.restype = W.HANDLE
    for name in ('Process32FirstW', 'Process32NextW'):
        getattr(kernel, name).argtypes = [W.HANDLE, C.POINTER(ProcessEntry)]
        getattr(kernel, name).restype = W.BOOL
    kernel.CloseHandle.argtypes = [W.HANDLE]
    user.GetForegroundWindow.restype = W.HWND
    user.GetAncestor.argtypes = [W.HWND, W.UINT]
    user.GetAncestor.restype = W.HWND
    user.GetWindow.argtypes = [W.HWND, W.UINT]
    user.GetWindow.restype = W.HWND
    user.GetWindowThreadProcessId.argtypes = [W.HWND, C.POINTER(W.DWORD)]
    user.GetClientRect.argtypes = [W.HWND, C.POINTER(W.RECT)]
    user.ClientToScreen.argtypes = [W.HWND, C.POINTER(W.POINT)]
    user.IsWindowVisible.argtypes = [W.HWND]
    user.IsIconic.argtypes = [W.HWND]
    callback_type = C.WINFUNCTYPE(W.BOOL, W.HWND, W.LPARAM)
    user.EnumWindows.argtypes = [callback_type, W.LPARAM]
    # Coordenadas físicas; o processo Electron converte para DIPs do monitor.
    try:
        user.SetProcessDpiAwarenessContext.argtypes = [W.HANDLE]
        user.SetProcessDpiAwarenessContext(C.c_void_p(-4))
    except AttributeError:
        user.SetProcessDPIAware()
    pids, refreshed, emitted, previous = set(), 0, 0, None
    while True:
        now = time.monotonic()
        if now - refreshed >= 1:
            refreshed = now
            pids = set()
            snapshot = kernel.CreateToolhelp32Snapshot(2, 0)
            if snapshot == C.c_void_p(-1).value:
                raise C.WinError(C.get_last_error())
            try:
                entry = ProcessEntry()
                entry.dwSize = C.sizeof(entry)
                valid = kernel.Process32FirstW(snapshot, C.byref(entry))
                while valid:
                    if entry.szExeFile.casefold() == 'tl.exe':
                        pids.add(entry.th32ProcessID)
                    valid = kernel.Process32NextW(snapshot, C.byref(entry))
            finally:
                kernel.CloseHandle(snapshot)
        foreground = user.GetForegroundWindow()
        root = user.GetAncestor(foreground, 3) if foreground else None
        ancestors = set()
        cursor = foreground
        for _ in range(12):
            if not cursor or cursor in ancestors:
                break
            ancestors.add(cursor)
            cursor = user.GetWindow(cursor, 4)  # GW_OWNER: inclui proprietários intermediários de popups.
        if foreground:
            ancestors.add(user.GetAncestor(foreground, 2))  # GA_ROOT: raiz de controles filhos.
        ancestors.discard(None); ancestors.discard(0)
        candidates = []
        @callback_type
        def visit(hwnd, _):
            pid = W.DWORD()
            user.GetWindowThreadProcessId(hwnd, C.byref(pid))
            if pid.value in pids and user.IsWindowVisible(hwnd) and not user.IsIconic(hwnd):
                rect, origin = W.RECT(), W.POINT()
                if user.GetClientRect(hwnd, C.byref(rect)) and user.ClientToScreen(hwnd, C.byref(origin)):
                    width, height = rect.right - rect.left, rect.bottom - rect.top
                    if width > 0 and height > 0:
                        candidates.append((width * height, hwnd, dict(x=origin.x, y=origin.y, width=width, height=height)))
            return True
        user.EnumWindows(visit, 0)
        game = max(candidates, key=lambda item: (item[1] == foreground, item[0])) if candidates else None
        value = dict(active=bool(game and game[1] in (foreground, root)), foreground=str(foreground or 0),
                     foregroundOwner=str(root or 0),
                     foregroundAncestors=sorted(str(hwnd) for hwnd in ancestors),
                     hwnd=str(game[1]) if game else None, bounds=game[2] if game else None)
        if value != previous or now - emitted >= 2:
            print(json.dumps(value), flush=True)
            previous, emitted = value, now
        time.sleep(.1)


if __name__ == '__main__':
    watch()
