using System.Security.Cryptography;
using System.Text.Json;
using CUE4Parse.FileProvider;
using CUE4Parse.UE4.Assets.Exports.Texture;
using BCnEncoder.Decoder;
using BCnEncoder.Shared;
using System.Buffers.Binary;
using System.IO.Compression;
using System.IO.Hashing;

static class TextureExport
{
    public static List<object> Run(DefaultFileProvider provider, JsonElement plan, string reportDir)
    {
        var root = Path.Combine(reportDir, "icons");
        Directory.CreateDirectory(root);
        var results = new List<object>();
        var checkpointPath = Path.Combine(root, "export-checkpoint.json");
        var cache = new Dictionary<string, TextureRecord>();
        if (File.Exists(checkpointPath))
        {
            try { cache = (JsonSerializer.Deserialize<List<TextureRecord>>(File.ReadAllText(checkpointPath)) ?? []).ToDictionary(row => row.source); }
            catch (JsonException) { Console.WriteLine("Checkpoint incompleto; arquivos existentes serão preservados e reavaliados."); }
        }
        var count = 0;
        foreach (var entry in plan.GetProperty("paths").EnumerateArray())
        {
            var source = entry.GetString()!;
            string? error = null;
            string? sha256 = null;
            string? output = null;
            var width = 0;
            var height = 0;
            if (cache.TryGetValue(source, out var cached) && cached.error == null && cached.output != null)
            {
                var cachedPath = Path.GetFullPath(Path.Combine(reportDir, cached.output));
                if (cachedPath.StartsWith(Path.GetFullPath(root) + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)
                    && File.Exists(cachedPath))
                {
                    using var stream = File.OpenRead(cachedPath);
                    if (Convert.ToHexStringLower(SHA256.HashData(stream)) == cached.sha256)
                    {
                        results.Add(cached);
                        if (++count % 100 == 0) Console.WriteLine($"Ícones {count}: cache validado");
                        continue;
                    }
                }
            }
            try
            {
                var objects = provider.LoadPackage(source).GetExports().ToArray();
                var texture = objects.OfType<UTexture2D>().FirstOrDefault();
                byte[] bytes;
                var extension = ".png";
                if (texture == null)
                {
                    bytes = System.Text.Encoding.UTF8.GetBytes(Newtonsoft.Json.JsonConvert.SerializeObject(objects, Newtonsoft.Json.Formatting.Indented));
                    extension = ".json";
                }
                else
                {
                    var mip = texture.GetMip(texture.GetFirstMipIndex()) ?? throw new InvalidDataException("Mipmap não encontrado.");
                    width = mip.SizeX; height = mip.SizeY;
                    var raw = mip.BulkData?.Data ?? throw new InvalidDataException("Mipmap sem dados.");
                    bytes = Png(DecodeRgba(raw, texture.Format.ToString(), width, height), width, height);
                }
                var relative = source.StartsWith("TL/Content/", StringComparison.OrdinalIgnoreCase) ? source[11..] : source;
                var target = Path.GetFullPath(Path.Combine(root, Path.ChangeExtension(relative.Replace('/', Path.DirectorySeparatorChar), extension)));
                if (!target.StartsWith(Path.GetFullPath(root) + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
                    throw new InvalidDataException("Caminho de textura fora do destino.");
                Directory.CreateDirectory(Path.GetDirectoryName(target)!);
                File.WriteAllBytes(target, bytes);
                output = Path.GetRelativePath(reportDir, target);
                sha256 = Convert.ToHexStringLower(SHA256.HashData(bytes));
            }
            catch (Exception failure) { error = failure.GetBaseException().Message; }
            results.Add(new TextureRecord(source, output, sha256, width, height, error));
            if (++count % 100 == 0 || error != null) Console.WriteLine($"Ícones {count}: {Path.GetFileName(source)}: {error ?? "OK"}");
            if (count % 100 == 0) File.WriteAllText(checkpointPath, JsonSerializer.Serialize(results));
        }
        File.WriteAllText(checkpointPath, JsonSerializer.Serialize(results));
        return results;
    }

    private static byte[] DecodeRgba(byte[] raw, string format, int width, int height)
    {
        if (width <= 0 || height <= 0 || (long)width * height > 16777216) throw new InvalidDataException("Dimensão de ícone inválida.");
        var rgba = new byte[checked(width * height * 4)];
        if (format is "PF_B8G8R8A8" or "PF_R8G8B8A8")
        {
            raw.AsSpan(0, rgba.Length).CopyTo(rgba);
            if (format == "PF_B8G8R8A8") for (var i = 0; i < rgba.Length; i += 4) (rgba[i], rgba[i + 2]) = (rgba[i + 2], rgba[i]);
            return rgba;
        }
        if (format == "PF_G8")
        {
            for (var i = 0; i < width * height; i++) { rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = raw[i]; rgba[i * 4 + 3] = 255; }
            return rgba;
        }
        var compression = format switch {
            "PF_DXT1" => CompressionFormat.Bc1, "PF_DXT3" => CompressionFormat.Bc2,
            "PF_DXT5" => CompressionFormat.Bc3, "PF_BC4" => CompressionFormat.Bc4,
            "PF_BC5" => CompressionFormat.Bc5, "PF_BC7" => CompressionFormat.Bc7,
            _ => throw new NotSupportedException($"Formato de textura: {format}")
        };
        using var compressed = new MemoryStream(raw, false);
        var pixels = new BcDecoder().DecodeRaw(compressed, width, height, compression);
        for (var i = 0; i < pixels.Length; i++) { rgba[i * 4] = pixels[i].r; rgba[i * 4 + 1] = pixels[i].g; rgba[i * 4 + 2] = pixels[i].b; rgba[i * 4 + 3] = pixels[i].a; }
        return rgba;
    }

    private static byte[] Png(byte[] rgba, int width, int height)
    {
        using var png = new MemoryStream();
        png.Write(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 });
        var header = new byte[13];
        BinaryPrimitives.WriteInt32BigEndian(header, width); BinaryPrimitives.WriteInt32BigEndian(header.AsSpan(4), height);
        header[8] = 8; header[9] = 6; Chunk(png, "IHDR", header);
        using var compressed = new MemoryStream();
        using (var zip = new ZLibStream(compressed, CompressionLevel.Fastest, true))
            for (var y = 0; y < height; y++) { zip.WriteByte(0); zip.Write(rgba, y * width * 4, width * 4); }
        Chunk(png, "IDAT", compressed.ToArray()); Chunk(png, "IEND", []);
        return png.ToArray();
    }

    private static void Chunk(Stream target, string kind, byte[] data)
    {
        Span<byte> number = stackalloc byte[4];
        BinaryPrimitives.WriteInt32BigEndian(number, data.Length); target.Write(number);
        var payload = System.Text.Encoding.ASCII.GetBytes(kind).Concat(data).ToArray(); target.Write(payload);
        BinaryPrimitives.WriteUInt32BigEndian(number, Crc32.HashToUInt32(payload)); target.Write(number);
    }
}

sealed record TextureRecord(string source, string? output, string? sha256, int width, int height, string? error);
