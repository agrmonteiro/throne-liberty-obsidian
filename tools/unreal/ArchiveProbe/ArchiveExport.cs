using System.Security.Cryptography;
using System.Text.Json;
using CUE4Parse.FileProvider;
using CUE4Parse.UE4.Assets;
using CUE4Parse.UE4.Assets.Exports.Engine;
using CUE4Parse.UE4.Localization;
using Newtonsoft.Json;

static class ArchiveExport
{
    public static List<object> Run(DefaultFileProvider provider, string planFile, string reportDir, string input)
    {
        using var plan = JsonDocument.Parse(File.ReadAllText(planFile));
        if (plan.RootElement.TryGetProperty("kind", out var kind) && kind.GetString() == "textures")
            return TextureExport.Run(provider, plan.RootElement, reportDir);
        var destination = Path.GetFullPath(Path.Combine(reportDir, "skill-data"));
        if (destination.StartsWith(input + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Destino de exportação precisa ficar fora da pasta do jogo.");
        ObjectTypeRegistry.RegisterClass("TLJsonDataTable", typeof(UDataTable));
        var result = new List<object>();
        var checkpointPath = Path.Combine(destination, "export-checkpoint.json");
        var count = 0;
        foreach (var item in plan.RootElement.GetProperty("paths").EnumerateArray())
        {
            var assetPath = item.GetString()!;
            var outputs = new List<object>();
            string? error = null;
            int? rows = null;
            try
            {
                var file = provider.Files[assetPath];
                var package = assetPath.EndsWith(".uasset", StringComparison.OrdinalIgnoreCase);
                IReadOnlyDictionary<string, byte[]> parts;
                if (package)
                {
                    if (!provider.TrySavePackage(file, out parts!)) throw new IOException("Não foi possível ler o pacote.");
                }
                else parts = new Dictionary<string, byte[]> { [assetPath] = file.Read() };
                foreach (var (partPath, bytes) in parts)
                {
                    var name = Path.GetFileName(partPath.Replace('\\', '/'));
                    var locale = assetPath.EndsWith(".locres", StringComparison.OrdinalIgnoreCase)
                        ? Path.GetFileName(Path.GetDirectoryName(assetPath.Replace('/', Path.DirectorySeparatorChar))) : "tables";
                    var target = Path.Combine(destination, "raw", locale!, name);
                    Directory.CreateDirectory(Path.GetDirectoryName(target)!);
                    File.WriteAllBytes(target, bytes);
                    outputs.Add(new { path = Path.GetRelativePath(reportDir, target), bytes = bytes.Length,
                        sha256 = Convert.ToHexStringLower(SHA256.HashData(bytes)) });
                }
                if (package)
                {
                    var objects = provider.LoadPackage(file).GetExports().ToArray();
                    rows = objects.OfType<UDataTable>().Sum(table => table.RowMap?.Count ?? 0);
                    var jsonPath = Path.Combine(destination, "properties", Path.GetFileNameWithoutExtension(assetPath) + ".json");
                    Directory.CreateDirectory(Path.GetDirectoryName(jsonPath)!);
                    File.WriteAllText(jsonPath, JsonConvert.SerializeObject(objects, Formatting.Indented));
                    outputs.Add(new { path = Path.GetRelativePath(reportDir, jsonPath), bytes = new FileInfo(jsonPath).Length });
                }
                else if (assetPath.EndsWith(".locres", StringComparison.OrdinalIgnoreCase))
                {
                    using var reader = file.CreateReader();
                    var localization = new FTextLocalizationResource(reader);
                    var locale = Path.GetFileName(Path.GetDirectoryName(assetPath.Replace('/', Path.DirectorySeparatorChar)));
                    var jsonPath = Path.Combine(destination, "localization", locale + ".json");
                    Directory.CreateDirectory(Path.GetDirectoryName(jsonPath)!);
                    File.WriteAllText(jsonPath, JsonConvert.SerializeObject(localization, Formatting.Indented));
                    rows = localization.Entries.Sum(group => group.Value.Count);
                    outputs.Add(new { path = Path.GetRelativePath(reportDir, jsonPath), bytes = new FileInfo(jsonPath).Length });
                }
            }
            catch (Exception failure) { error = failure.GetBaseException().Message; }
            result.Add(new { source = assetPath, outputs, rows, error });
            File.WriteAllText(checkpointPath, System.Text.Json.JsonSerializer.Serialize(result));
            if (++count % 20 == 0 || error != null)
                Console.WriteLine($"{count}/{plan.RootElement.GetProperty("paths").GetArrayLength()}: {Path.GetFileName(assetPath)}: {(error ?? $"OK ({rows?.ToString() ?? "recurso"})")}");
        }
        return result;
    }
}
