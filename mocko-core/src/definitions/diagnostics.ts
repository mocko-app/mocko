import { Provider } from "../utils/decorators/provider";

export type DiagnosticSeverity = 'error' | 'warning';

export type Diagnostic = {
    code: string,
    severity: DiagnosticSeverity,
    message: string,
    file?: string,
    mock?: string,
};

@Provider()
export class DiagnosticsCollector {
    private enabled = false;
    private readonly items: Diagnostic[] = [];

    enable(): void {
        this.enabled = true;
    }

    push(diagnostic: Diagnostic): void {
        if(this.enabled) {
            this.items.push(diagnostic);
        }
    }

    get diagnostics(): Diagnostic[] {
        return [...this.items];
    }
}
