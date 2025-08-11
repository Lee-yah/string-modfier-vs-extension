import * as vscode from 'vscode';

const DEBUG = false; // Debug flag to control output channel
let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
    // Create output channel only in debug mode
    if (DEBUG) {
        outputChannel = vscode.window.createOutputChannel('String Modifier');
        outputChannel.show(true);
        outputChannel.appendLine('Starting activation...');
    }

    // Register the webview provider
    const provider = new StringModifierViewProvider(context.extensionUri);
    
    const disposable = vscode.window.registerWebviewViewProvider(
        StringModifierViewProvider.viewType,
        provider,
        {
            webviewOptions: { retainContextWhenHidden: true }
        }
    );
    
    context.subscriptions.push(disposable);
}

export function deactivate() {}


class StringModifierViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'string-modifier.sidebar';

    constructor(private readonly extensionUri: vscode.Uri) {}

    private getWebviewUri(webview: vscode.Webview, ...paths: string[]) {
        return webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, ...paths));
    }

resolveWebviewView(webviewView: vscode.WebviewView): void {
    // Get the media URI
    const copyIconUri = this.getWebviewUri(webviewView.webview, 'media', 'content_copy_24.svg');
    const codiconsUri = webviewView.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css'));

	webviewView.webview.options = {
		enableScripts: true // Enable JavaScript in the webview
	};

    webviewView.webview.onDidReceiveMessage(message => {
        if (DEBUG) {
            switch (message.type) {
                case 'log':
                    outputChannel?.appendLine(message.value);
                    break;
            }
        }
    });
    
    webviewView.webview.html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${codiconsUri}" rel="stylesheet" />
            <style>
                /* Base variables */
                :root {
                    --spacing-unit: 5px;
                    --border-radius: 2px;
                    --transition-duration: 0.2s;
                    --font-size-base: 12px;
                    --control-height: 24px;
                    --input-padding: 5px;
                }

                /* Global typography */
                body, button, input, textarea, label {
                    font-family: var(--vscode-font-family);
                    font-size: var(--font-size-base);
                    line-height: 1.4;
                }

                /* Layout */
                body {
                    padding: calc(var(--spacing-unit) * 2);
                    margin: var(--spacing-unit);
                    color: var(--vscode-foreground);
                }

                /* Form elements */
                .input-group {
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-unit);
                }

                label {
                    display: inline-flex;
                    align-items: center;
                    gap: var(--spacing-unit);
                }

                input, button {
                    height: var(--control-height);
                    box-sizing: border-box;
                    padding: 0 var(--input-padding);
                }

                textarea,
                input {
                    background: var(--vscode-dropdown-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: var(--border-radius);
                }

                textarea {
                    min-height: 80px;
                    max-height: 200px;
                    resize: vertical;
                    padding: var(--input-padding);
                }

                /* Buttons */
                button {
                    border-radius: var(--border-radius);
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }

                .action-btn {
                    background: none;
                    border: none;
                    padding: 0;
                    opacity: 0.8;
                    transition: opacity var(--transition-duration);
                    position: relative;
                }

                .action-btn:hover {
                    opacity: 1;
                }

                .action-btn img {
                    width: 16px;
                    height: 16px;
                    vertical-align: middle;
                }

                #replaceBtn {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    margin-top: calc(var(--spacing-unit) * 2);
                    padding: 0 calc(var(--spacing-unit) * 3);
                }

                #resetBtn {
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: px solid var(--vscode-button-secondaryBorder);
                    margin-top: calc(var(--spacing-unit) * 2);
                    padding: 0 calc(var(--spacing-unit) * 3);
                }

                #resetBtn:hover {
                    background: var(--vscode-button-secondaryHoverBackground);
                }

                /* Result area */
                #resultText{
                    white-space: pre-wrap;
                }

                #result-content-area { 
                    position: relative;
                    border: 1px solid var(--vscode-editorWidget-border);
                    min-height: 60px;
                    max-height: 300px;
                    padding: calc(var(--spacing-unit) * 2);
                    border-radius: var(--border-radius);
                    background: var(--vscode-editorWidget-background);
                    overflow: auto;
                }

                /* Tooltip */
                .tooltip {
                    visibility: hidden;
                    background: var(--vscode-editorWidget-background);
                    color: var(--vscode-editorWidget-foreground);
                    text-align: center;
                    border-radius: calc(var(--border-radius) * 2);
                    padding: calc(var(--spacing-unit) * 0.8) calc(var(--spacing-unit) * 2);
                    position: absolute;
                    z-index: 1;
                    bottom: 125%;
                    right: 0;
                    transform: translateX(0);
                    opacity: 0;
                    transition: opacity var(--transition-duration);
                    pointer-events: none;
                    white-space: nowrap;
                }

                .action-btn.show-tooltip .tooltip {
                    visibility: visible;
                    opacity: 1;
                }

                /* Utility classes */
                .copy-button-container {
                    position: absolute;
                    top: 0.5px;
                    right: 3px;
                    z-index: 102;
                    padding: 2px;
                }

                .result-actions {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: calc(var(--spacing-unit) * 2);
                }

                .error-area {
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 8px;
                    color: var(--vscode-errorForeground);
                    font-size: var(--font-size-base);
                }
                
                /* Checkboxes container */
                .radio-group input[type="checkbox"] {
                    margin: 0;
                    height: 14px;
                    width: 14px;
                    border: 1px solid var(--vscode-input-border);
                    outline: none;
                    accent-color: var(--vscode-button-background);
                }
                    

                .radio-group input[type="checkbox"].error {
                    appearance: none;
                    -webkit-appearance: none;
                    border: 1px solid var(--vscode-errorForeground);
                } 
            </style>
        </head>
        <body>
            <div class="container">
                <div class="instructions">
                    <h4>How to use:</h4>
                    <ol>
                        <li>Enter string (single or multiple lines) to modify</li>
                        <li>Specify the string to replace</li>
                        <li>Enter the replacement string</li>
                        <li>Click "Modify" to see the result</li>
                    </ol>
                </div>

                <div class="input-group">
                    <label for="sourceString">String to modify (single or multiple):</label>
                    <textarea id="sourceString" placeholder="Enter your strings here"></textarea>

                    <div style="margin-top: 10px;"> </div>
                    
                    <label for="findString">String to replace:</label>
                    <input type="text" id="findString" placeholder="e.g., a">
                    
                    <label for="replaceString">Replace with:</label>
                    <input type="text" id="replaceString" placeholder="e.g., @">

                    <div class="radio-group" style="margin-top: 5px;">
                        <label>
                            <input type="checkbox" id="isCutStrings" >
                            Remove first char from each line including and up to first occurrence of:
                        </label>
                        <input 
                            type="text" 
                            id="cutPosition"
                            placeholder="e.g., web, @" 
                            style="width: 100px; margin-right: 10px; margin-top: 5px;"
                            title="Enter a stringto set where the stringremoval should end"
                            disabled
                        >
                    </div>

                    <div class="radio-group" style="margin-top: 5px;">
                        <label>
                            <input type="checkbox" id="isConvertSlash" checked>
                            Convert backward slashes (\\) to forward slashes (/)
                        </label>
                    </div>

                    <div class="radio-group" style="margin-top: 5px;">
                        <label>
                            <input type="checkbox" id="isTrimStartEnd" checked>
                            Trim first and last whitespace from each line
                        </label>
                    </div>
                    
                    <button id="replaceBtn" style= "margin-top: 10px;">Modify</button>
                </div>

                <div class="result">
                    <h4>Result:</h4>
                    <div id="result-content-area" style="display: none;">
                        <div id="operations" class="copy-button-container">
                            <button id="copyBtn" class="action-btn" style="display: none;">
                                <img src="${copyIconUri}" alt="Copy">
                                <span class="tooltip" id="copyTooltip">Copied!</span>
                            </button>
                        </div>
                        <p id="resultText"></p>
                    </div>            
                    <div class="error-area">
                        <span id="codicon codicon-error"></span>
                        <span id="errorMessage"></span>
                    </div>
                    <div id="operations" class="result-actions">
                        <button id="resetBtn" class="action-btn" style="display: none;">
                            Reset
                        </button>
                    </div>
                </div>
            </div>
            <script>
                (function() {
                    // Constants
                    const vscode = acquireVsCodeApi();
                    const COPY_TIMEOUT = 1500;
                    const ERROR_TIMEOUT = 2000;
                    const DEFAULT_BORDER = '1px solid var(--vscode-input-border)';
                    const ERROR_BORDER = '1px solid var(--vscode-errorForeground, #f14c4c)';

                    // DOM Elements
                    const elements = {
                        sourceInput: document.getElementById('sourceString'),
                        findStringInput: document.getElementById('findString'),
                        replaceStringInput: document.getElementById('replaceString'),
                        isCutStringsInput: document.getElementById('isCutStrings'),
                        cutPositionInput: document.getElementById('cutPosition'),
                        isConvertSlashInput: document.getElementById('isConvertSlash'),
                        isTrimStartEndInput: document.getElementById('isTrimStartEnd'),
                        resultArea: document.getElementById('result-content-area'),
                        resultText: document.getElementById('resultText'),
                        errorMessage: document.getElementById('errorMessage'),
                        errorIcon: document.getElementById('codicon codicon-error'),
                        replaceBtn: document.getElementById('replaceBtn'),
                        copyBtn: document.getElementById('copyBtn'),
                        copyTooltip: document.getElementById('copyTooltip'),
                        resetBtn: document.getElementById('resetBtn'),
                    };

                    // Helper Functions
                    function resetBorders() {
                        elements.sourceInput.style.border = DEFAULT_BORDER;
                        elements.findStringInput.style.border = DEFAULT_BORDER;
                        elements.replaceStringInput.style.border = DEFAULT_BORDER;
                        elements.cutPositionInput.style.border = DEFAULT_BORDER;
                        elements.isCutStringsInput.classList.remove('error');
                        elements.isConvertSlashInput.classList.remove('error');
                        elements.isTrimStartEndInput.classList.remove('error');
                        elements.errorIcon.classList.remove('codicon', 'codicon-error');
                    }

                    function showError(message, ...inputsToHighlight) {
                    elements.errorIcon.classList.add('codicon', 'codicon-error');
                        elements.errorMessage.textContent = message;
                        inputsToHighlight.forEach(input => {
                            if (input.type === 'checkbox') {
                                input.classList.add('error');
                            } else {
                                input.style.border = ERROR_BORDER;
                            }
                        });
                    }

                    function resetUI() {
                        elements.sourceInput.value = '';
                        elements.findStringInput.value = '';
                        elements.replaceStringInput.value = '';
                        elements.isCutStringsInput.checked = false;
                        elements.cutPositionInput.value = '';
                        elements.isConvertSlashInput.checked = true;
                        elements.cutPositionInput.disabled = true;
                        elements.isTrimStartEndInput.checked = true;
                        elements.resultArea.style.display = 'none';
                        elements.resultText.textContent = '';
                        elements.errorMessage.textContent = '';
                        elements.copyBtn.style.display = 'none';
                        elements.resetBtn.style.display = 'none';
                        resetBorders();
                    }

                    function handleCutStringsChange() {
                        const isChecked = elements.isCutStringsInput.checked;
                        elements.cutPositionInput.disabled = !isChecked;

                        if (isChecked) {
                            elements.cutPositionInput.focus();
                        }
                        
                        if (!isChecked) {
                            elements.cutPositionInput.value = '';
                            elements.cutPositionInput.style.border = DEFAULT_BORDER;
                            elements.errorMessage.textContent = '';
                            elements.errorIcon.classList.remove('codicon', 'codicon-error');
                        }
                    }

                    async function handleCopy() {
                        try {
                            await navigator.clipboard.writeText(elements.resultText.textContent);
                            elements.copyBtn.classList.add('show-tooltip');
                            setTimeout(() => {
                                elements.copyBtn.classList.remove('show-tooltip');
                            }, COPY_TIMEOUT);
                        } catch (err) {
                            elements.copyTooltip.textContent = 'Failed to copy text';
                            elements.copyBtn.classList.add('show-tooltip');
                            setTimeout(() => {
                                elements.copyBtn.classList.remove('show-tooltip');
                                elements.copyTooltip.textContent = 'Copied!';
                            }, ERROR_TIMEOUT);
                        }
                    }

                    function handleReplace() {
                        try {
                            const sourceString= elements.sourceInput.value;
                            const findString = elements.findStringInput.value;
                            const replaceString = elements.replaceStringInput.value;
                            const isCutStrings = elements.isCutStringsInput.checked;
                            const cutPosition = elements.cutPositionInput.value;
                            const isConvertSlash = elements.isConvertSlashInput.checked;
                            const isTrimStartEnd = elements.isTrimStartEndInput.checked;

                            // Reset UI state
                            elements.errorMessage.textContent = '';
                            elements.resultText.textContent = '';
                            elements.resultArea.style.display = 'none';
                            elements.copyBtn.style.display = 'none';
                            elements.resetBtn.style.display = 'none';
                            resetBorders();

                            // Validate inputs            
                            if (!sourceString) {
                                showError('Please enter a value', elements.sourceInput);
                                return;
                            }

                            if ((!findString && replaceString) || (findString && !replaceString)) {
                                showError('Both find and replace values are required for replacement',
                                    elements.findStringInput, elements.replaceStringInput);
                                return;
                            }

                            if (isCutStrings && !cutPosition) {
                                showError('Please specify where to end removal', elements.cutPositionInput);
                                return;
                            }

                            if (sourceString && (!findString || !replaceString) && 
                                !isConvertSlash && !isCutStrings && !isTrimStartEnd) {
                                showError('No modifications selected. Choose an operation or enter values to replace', 
                                    elements.findStringInput, 
                                    elements.replaceStringInput,
                                    elements.isConvertSlashInput,
                                    elements.isCutStringsInput,
                                    elements.isTrimStartEndInput
                                );
                                return;
                            }
                            // Process text
                            const escapedFindString = findString ? findString.replace(/[\.\\\\]/g, '\\\\$&'): '';
                            const result = findString ? sourceString.replace(new RegExp(escapedFindString, 'g'), replaceString) : sourceString;
                            const finalCutResult = result && isCutStrings ?
                                result.split('\\n').map(line => {
                                    const cutIndex = line.indexOf(cutPosition);
                                    return cutIndex !== -1 ? line.substring(cutIndex + cutPosition.length) : line;
                            }).join('\\n') : result;
                            const finalReplacementResult = finalCutResult && isConvertSlash ? finalCutResult.replace(/\\\\/g, '/') : finalCutResult;
                            const finalResult = finalReplacementResult && isTrimStartEnd ? 
                                finalReplacementResult.split('\\n').map(line => 
                                    line.trim()).join('\\n') : finalReplacementResult;

                            // Update UI with result
                            elements.resultText.textContent = finalResult;
                            elements.resultArea.style.display = 'block';
                            elements.copyBtn.style.display = 'inline-block';
                            elements.resetBtn.style.display = 'block';

                            // Log to VS Code - Fixed reference
                            vscode.postMessage({ 
                                type: 'log',
                                value: 'string replacement completed'
                            });

                        } catch (error) {
                            // Handle all errors
                            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                            showError(errorMessage, elements.sourceInput);
                            // Fixed vscode reference here too
                            vscode.postMessage({ 
                                type: 'log',
                                value: 'Error: ' + errorMessage
                            });
                        }
                    }

                    // Event Listeners
                    elements.isCutStringsInput.addEventListener('change', handleCutStringsChange);
                    elements.copyBtn.addEventListener('click', handleCopy);
                    elements.replaceBtn.addEventListener('click', handleReplace);
                    elements.resetBtn.addEventListener('click', resetUI);

                    // Add checkbox click handlers to remove error class
                    const checkboxInputs = [
                        elements.isCutStringsInput,
                        elements.isConvertSlashInput,
                        elements.isTrimStartEndInput
                    ];

                    checkboxInputs.forEach(checkbox => {
                        checkbox.addEventListener('click', () => {
                            checkbox.classList.remove('error');
                        });
                    });

                    // Initialize
                    resetUI();
                })();
            </script>
        </body>
        </html>
    `;
}
}
