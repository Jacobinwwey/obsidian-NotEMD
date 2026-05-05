import { buildProviderDiagnosticFileName } from '../providerDiagnostics';

export interface ProviderDiagnosticReportHost {
    exists: (path: string) => Promise<boolean>;
    create: (path: string, content: string) => Promise<void>;
}

export async function persistProviderDiagnosticReport(params: {
    providerName: string;
    reportContent: string;
    host: ProviderDiagnosticReportHost;
    now?: Date;
}): Promise<string> {
    const baseFileName = buildProviderDiagnosticFileName(params.providerName, params.now ?? new Date());
    const fileSuffix = '.txt';
    const fileStem = baseFileName.endsWith(fileSuffix)
        ? baseFileName.slice(0, -fileSuffix.length)
        : baseFileName;

    let candidatePath = baseFileName;
    let index = 1;

    while (await params.host.exists(candidatePath)) {
        candidatePath = `${fileStem}_${index}${fileSuffix}`;
        index += 1;
    }

    await params.host.create(candidatePath, params.reportContent);
    return candidatePath;
}
