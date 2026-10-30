using System.Text.Json;
using System.Text.RegularExpressions;
using System.Collections.Concurrent;
using CUE4Parse.FileProvider;
using CUE4Parse.UE4.Versions;
using Serilog;
using Serilog.Core;
using Serilog.Events;

if (args.Length != 2)
{
    Console.Error.WriteLine("Uso: ArchiveProbe <pasta Paks do TL> <relatório JSON>");
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
var containers = provider.MountedVfs.Concat(provider.UnloadedVfs).Select(reader => new {
    name = reader.Name, encrypted = reader.IsEncrypted, files = reader.Files.Count,
    mounted = provider.MountedVfs.Contains(reader), keyGuid = reader.EncryptionKeyGuid.ToString()
}).OrderBy(reader => reader.name).ToArray();
var paths = provider.Files.Keys.OrderBy(path => path, StringComparer.OrdinalIgnoreCase).ToArray();
var candidates = paths.Where(path => Regex.IsMatch(path,
    @"skill|ability|datatable|stringtable|localization|\.locres$|assetregistry", RegexOptions.IgnoreCase)).ToArray();
var report = new {
    generatedAt = DateTimeOffset.UtcNow, input, mode = "read-only-index",
    parser = typeof(DefaultFileProvider).Assembly.GetName().Version?.ToString(),
    gamePreset = nameof(EGame.GAME_ThroneAndLiberty), inventory,
    registeredContainers = registered, mountedContainers = provider.MountedVfs.Count,
    unloadedContainers = provider.UnloadedVfs.Count, visibleFiles = paths.Length,
    requiredKeyGuids = provider.RequiredKeys.Select(key => key.ToString()).ToArray(),
    containers, candidates, paths, diagnostics = diagnostics.Messages.ToArray(),
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
return 0;

sealed class DiagnosticSink : ILogEventSink
{
    public ConcurrentQueue<string> Messages { get; } = new();
    public void Emit(LogEvent logEvent) => Messages.Enqueue(logEvent.RenderMessage().Split('\n')[0].TrimEnd('\r')
        + (logEvent.Exception is { } error ? $" — {error.GetBaseException().Message}" : ""));
}
