/**
 * Gabungkan kode semua part untuk uji rangkaian akhir.
 *
 * Setiap part tetap diedit dan dicek sendiri. Saat rangkaian dijalankan,
 * starter code part disusun berurutan dalam satu interpreter. Deklarasi input
 * yang ditandai sebagai hasil part sebelumnya dihapus dari part berikutnya,
 * sehingga function berikutnya memakai nilai hasil yang benar-benar dibuat
 * function sebelumnya — bukan salinan contoh di starter code.
 */

const sameValue = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Hubungan output part sebelumnya → input part berikutnya. */
export function findPartConnections(parts) {
    const connections = [];

    for (let targetIndex = 1; targetIndex < parts.length; targetIndex++) {
        const target = parts[targetIndex];

        for (const [name, value] of Object.entries(target.inputAwal ?? {})) {
            for (let sourceIndex = 0; sourceIndex < targetIndex; sourceIndex++) {
                const source = parts[sourceIndex];
                const output = source.hasilAkhirTervalidasi ?? {};

                if (name in output && sameValue(output[name], value)) {
                    connections.push({
                        name,
                        fromPart: source.partKe,
                        toPart: target.partKe,
                    });
                    break;
                }
            }
        }
    }

    return connections;
}

function removeLinkedDeclarations(code, names) {
    if (names.size === 0) return code;

    const patterns = [...names].map(
        (name) => new RegExp(`^var\\s+${escapeRegExp(name)}\\s*=`),
    );

    return code
        .split("\n")
        .filter((line) => !patterns.some((pattern) => pattern.test(line)))
        .join("\n");
}

export function buildConnectedCode(parts, codes) {
    const connections = findPartConnections(parts);
    const linkedByPart = new Map();

    for (const connection of connections) {
        const names = linkedByPart.get(connection.toPart) ?? new Set();
        names.add(connection.name);
        linkedByPart.set(connection.toPart, names);
    }

    return codes
        .map((code, index) => {
            const part = parts[index];
            const linkedNames = linkedByPart.get(part.partKe) ?? new Set();
            const prepared = removeLinkedDeclarations(code, linkedNames);

            return [
                `// ===== Part ${part.partKe}: ${part.judulPart} =====`,
                prepared,
            ].join("\n");
        })
        .join("\n\n");
}