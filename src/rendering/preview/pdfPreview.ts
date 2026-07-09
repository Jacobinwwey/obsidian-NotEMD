export interface RasterImagePdfInput {
    imageData: ArrayBuffer;
    imageMimeType: 'image/jpeg';
    imageWidthPx: number;
    imageHeightPx: number;
    sourceWidthCssPx: number;
    sourceHeightCssPx: number;
}

const PDF_POINTS_PER_CSS_PIXEL = 72 / 96;

function encodeAscii(value: string): Uint8Array {
    const bytes = new Uint8Array(value.length);
    for (let index = 0; index < value.length; index += 1) {
        bytes[index] = value.charCodeAt(index) & 0xff;
    }
    return bytes;
}

function toUint8Array(data: ArrayBuffer | Uint8Array): Uint8Array {
    return data instanceof Uint8Array ? data : new Uint8Array(data);
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
    const length = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const output = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
        output.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return output;
}

function formatPdfNumber(value: number): string {
    if (Number.isInteger(value)) {
        return String(value);
    }

    return value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

function buildObject(id: number, body: Uint8Array | string): Uint8Array {
    const bodyBytes = typeof body === 'string' ? encodeAscii(body) : body;
    return concatBytes([
        encodeAscii(`${id} 0 obj\n`),
        bodyBytes,
        encodeAscii('\nendobj\n')
    ]);
}

function buildStreamObject(id: number, dictionary: string, stream: Uint8Array): Uint8Array {
    return buildObject(id, concatBytes([
        encodeAscii(`${dictionary}\nstream\n`),
        stream,
        encodeAscii('\nendstream')
    ]));
}

export function buildPdfFromRasterImage(input: RasterImagePdfInput): ArrayBuffer {
    if (input.imageMimeType !== 'image/jpeg') {
        throw new Error(`PDF export only supports JPEG raster input, received "${input.imageMimeType}".`);
    }

    const imageData = toUint8Array(input.imageData);
    const pageWidthPt = input.sourceWidthCssPx * PDF_POINTS_PER_CSS_PIXEL;
    const pageHeightPt = input.sourceHeightCssPx * PDF_POINTS_PER_CSS_PIXEL;
    const pageWidth = formatPdfNumber(pageWidthPt);
    const pageHeight = formatPdfNumber(pageHeightPt);
    const contentStream = encodeAscii(`q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ\n`);
    const objects = [
        buildObject(1, '<< /Type /Catalog /Pages 2 0 R >>'),
        buildObject(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>'),
        buildObject(
            3,
            `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`
        ),
        buildStreamObject(
            4,
            `<< /Type /XObject /Subtype /Image /Width ${input.imageWidthPx} /Height ${input.imageHeightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageData.byteLength} >>`,
            imageData
        ),
        buildStreamObject(5, `<< /Length ${contentStream.byteLength} >>`, contentStream)
    ];

    const chunks: Uint8Array[] = [encodeAscii('%PDF-1.4\n')];
    const offsets = [0];
    let offset = chunks[0].byteLength;
    for (const object of objects) {
        offsets.push(offset);
        chunks.push(object);
        offset += object.byteLength;
    }

    const xrefOffset = offset;
    const xrefEntries = offsets
        .map((objectOffset, index) => {
            if (index === 0) {
                return '0000000000 65535 f ';
            }
            return `${String(objectOffset).padStart(10, '0')} 00000 n `;
        })
        .join('\n');

    chunks.push(encodeAscii(
        `xref\n0 ${offsets.length}\n${xrefEntries}\ntrailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
    ));

    const output = concatBytes(chunks);
    const result = new ArrayBuffer(output.byteLength);
    new Uint8Array(result).set(output);
    return result;
}
