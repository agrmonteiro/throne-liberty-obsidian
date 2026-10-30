using System.Text.Json;
using System.Text.RegularExpressions;
using System.Collections.Concurrent;
using CUE4Parse.FileProvider;
using CUE4Parse.Encryption.Aes;
using CUE4Parse.UE4.Objects.Core.Misc;
using CUE4Parse.UE4.Versions;
using Serilog;
using Serilog.Core;
using Serilog.Events;

if (args.Length is < 2 or > 4)
{
    Console.Error.WriteLine("Uso: ArchiveProbe <pasta Paks do TL> <relatório JSON> [chaves JSON ou -] [plano de exportação JSON]");
    return 1;
}

var input = Path.GetFullPath(args[0]);
var output = Path.GetFullPath(args[1]);
if (!Directory.Exists(input)) throw new DirectoryNotFoundException(input);
if (output.StartsWith(input + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
    throw new ArgumentException("Grave o relatório fora da instalação do jogo.");

var diagnostics = new DiagnosticSink();
Log.Logger = new LoggerConfiguration().MinimumLevel.Warning().WriteTo.Sink(diagnostics).CreateLogger();
var inventory = Directory.EnumerateFiles(input, "*", SearchOption.TopDirectoryOnly)
    .Where(file => new[] { ".pak", ".utoc", ".ucas" }.Contains(Path.GetExtension(file).ToLowerInvariant()))
    .Select(file => new { name = Path.GetFileName(file), bytes = new FileInfo(file).Length })
    .OrderBy(file => file.name).ToArray();
using var provider = new DefaultFileProvider(input, SearchOption.TopDirectoryOnly,
    new VersionContainer(EGame.GAME_ThroneAndLiberty), StringComparer.OrdinalIgnoreCase);
provider.Initialize();
var registered = provider.UnloadedVfs.Count + provider.MountedVfs.Count;
provider.Mount();
var keysProvided = 0;
var unlocked = 0;
string? keySource = null;
if (args.Length >= 3 && args[2] != "-")
{
    using var keyDocument = JsonDocument.Parse(File.ReadAllText(args[2]));
    var keys = new Dictionary<FGuid, FAesKey>();
    foreach (var item in keyDocument.RootElement.GetProperty("keys").EnumerateArray())
        keys.Add(new FGuid(item.GetProperty("guid").GetString()!), new FAesKey(item.GetProperty("key").GetString()!));
    keysProvided = keys.Count;
    keySource = keyDocument.RootElement.TryGetProperty("source", out var source) ? source.GetString() : null;
    unlocked = provider.SubmitKeys(keys);
}
var containers = provider.MountedVfs.Concat(provider.UnloadedVfs).Select(reader => new {
    name = reader.Name, encrypted = reader.IsEncrypted, files = reader.Files.Count,
    mounted = provider.MountedVfs.Contains(reader), keyGuid = reader.EncryptionKeyGuid.ToString()
}).OrderBy(reader => reader.name).ToArray();
var paths = provider.Files.Keys.Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(path => path, StringComparer.OrdinalIgnoreCase).ToArray();
var candidates = paths.Where(path => Regex.IsMatch(path,
    @"skill|ability|/table/|stringtable|localization|\.locres$|assetregistry", RegexOptions.IgnoreCase)).ToArray();
var exports = args.Length == 4 ? ArchiveExport.Run(provider, args[3], Path.GetDirectoryName(output)!, input) : [];
var report = new {
    generatedAt = DateTimeOffset.UtcNow, input, mode = "read-only-index",
    parser = typeof(DefaultFileProvider).Assembly.GetName().Version?.ToString(),
    decryption = new { keysProvided, unlocked, source = keySource },
    gamePreset = nameof(EGame.GAME_ThroneAndLiberty), inventory,
    registeredContainers = registered, mountedContainers = provider.MountedVfs.Count,
    unloadedContainers = provider.UnloadedVfs.Count, visibleFiles = paths.Length,
    requiredKeyGuids = provider.RequiredKeys.Select(key => key.ToString()).ToArray(),
    containers, candidates, paths, exports, diagnostics = diagnostics.Messages.ToArray(),
    limitations = new[] {
        "Listing an index does not prove that asset contents can be decoded.",
        "Encrypted or unsupported containers may remain unavailable.",
        "Numeric combat IDs have not yet been linked to table rows by this probe."
    }
};
Directory.CreateDirectory(Path.GetDirectoryName(output)!);
File.WriteAllText(output, JsonSerializer.Serialize(report, new JsonSerializerOptions { WriteIndented = true }) + "\n");
Console.WriteLine($"Contêineres: {registered}; montados: {provider.MountedVfs.Count}; arquivos visíveis: {paths.Length}; candidatos: {candidates.Length}");
Console.WriteLine($"Relatório: {output}");
Console.WriteLine($"Contêineres criptografados: {containers.Count(reader => reader.encrypted)}; diagnósticos: {diagnostics.Messages.Count}");
Console.WriteLine($"Contêineres montados com a chave fornecida: {unlocked}");
return 0;

sealed class DiagnosticSink : ILogEventSink
{
    public ConcurrentQueue<string> Messages { get; } = new();
    public void Emit(LogEvent logEvent) => Messages.Enqueue(logEvent.RenderMessage().Split('\n')[0].TrimEnd('\r')
        + (logEvent.Exception is { } error ? $" — {error.GetBaseException().Message}" : ""));
}
