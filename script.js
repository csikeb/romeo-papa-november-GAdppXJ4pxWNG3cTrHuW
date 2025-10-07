const display = document.getElementById('display');
const buttons = document.querySelectorAll('.button');
// const stackView = document.getElementById('stack-view'); // 削除済み

// 4つのレジスタを定義
// T, Z, Y はオブジェクトのプロパティとして保持
let stack = {
    T: 0, 
    Z: 0, 
    Y: 0 
};
let currentInput = '0'; // Xレジスタの役割
let waitingForNewNumber = true; 

// --- スケール（拡大・縮小）ロジック ---

// 電卓の元の基準サイズ（CSSで定義した固定値）
// 幅: 300px (コンテンツ) + 20px*2 (padding) = 340px
// 【修正】高さ: 440px -> 500pxに増強し、すべてのボタンが確実に入るようにする
const BASE_WIDTH = 340; 
const BASE_HEIGHT = 540; 

const calculatorElement = document.querySelector('.calculator');

function scaleCalculator() {
    // 1. 現在のウィンドウの幅と高さを取得
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // 2. 基準サイズに対する拡大率を計算
    // 【修正】画面のフチに持たせる余白を増やします (40px -> 100px)
    const margin = 100; 
    const scaleX = (windowWidth - margin) / BASE_WIDTH;
    const scaleY = (windowHeight - margin) / BASE_HEIGHT;

    // 3. 縦横の拡大率のうち、小さい方を採用（縦横比を完全に維持するため）
    const scale = Math.min(scaleX, scaleY);
    
    // スケールを適用
    calculatorElement.style.transform = `scale(${scale})`;
    
    // 拡大後に電卓をウィンドウの中央に配置するための調整
    const scaledWidth = BASE_WIDTH * scale;
    const scaledHeight = BASE_HEIGHT * scale;

    const offsetX = (windowWidth - scaledWidth) / 2;
    const offsetY = (windowHeight - scaledHeight) / 2;
    
    // transform-origin: top left; と組み合わせて、正確に中央に配置
    calculatorElement.style.left = `${offsetX}px`;
    calculatorElement.style.top = `${offsetY}px`;
}

// ページロード時とウィンドウサイズ変更時に実行
window.addEventListener('resize', scaleCalculator);
document.addEventListener('DOMContentLoaded', scaleCalculator);

// --- ヘルパー関数 (factorial) ---
function factorial(n) {
    const num = Number(n);
    if (num < 0 || num !== Math.floor(num) || num > 20) {
        return "Error"; 
    }
    if (num === 0) {
        return 1;
    }
    let res = 1;
    for (let i = 2; i <= num; i++) {
        res *= i;
        if (res > Number.MAX_SAFE_INTEGER) {
             return "Error"; 
        }
    }
    return res;
}

// --- スタック表示を削除した関数 ---
function updateStackView() {
    // スタック表示の処理は削除
}

// 画面表示を更新する関数
function updateDisplay() {
    const displayValue = currentInput;
    display.value = String(displayValue).substring(0, 15);
}

// 演算を実行し、結果をレジスタに入れる関数
function performOperation(op) {
    const xValue = Number(currentInput);
    
    // 二項演算子 (+, -, *, /, pow) の処理
    if (['+', '-', '*', '/', 'pow'].includes(op)) {
        const tValueToRetain = stack.T; 
        const operand1 = stack.Y; 
        const operand2 = xValue; 
        let result = 0;

        switch (op) {
            case '+': result = operand1 + operand2; break;
            case '-': result = operand1 - operand2; break;
            case '*': result = operand1 * operand2; break;
            case '/': 
                result = (operand2 === 0) ? "Error" : operand1 / operand2; 
                break;
            case 'pow': 
                result = Math.pow(operand1, operand2); 
                break;
            default: return;
        }

        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
            stack.T = tValueToRetain;
            stack.Z = tValueToRetain; 
            stack.Y = stack.Z; 
            currentInput = String(result); 
        } else {
             result = "Error";
             stack.T = 0; stack.Z = 0; stack.Y = 0;
             currentInput = "Error";
        }
        
        waitingForNewNumber = true; 
        updateDisplay();
        return;
    }
    
    // 単項演算子 (sqrt, inv, fact) の処理
    if (['sqrt', 'inv', 'fact'].includes(op)) {
        const operand = xValue;
        let result = 0;
        
        switch (op) {
            case 'sqrt': 
                result = (operand < 0) ? "Error" : Math.sqrt(operand); 
                break;
            case 'inv': 
                result = (operand === 0) ? "Error" : 1 / operand; 
                break;
            case 'fact': 
                result = factorial(operand); 
                break;
            default: return;
        }

        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
            currentInput = String(result);
        } else {
            currentInput = "Error";
            stack.T = 0; stack.Z = 0; stack.Y = 0;
        }

        waitingForNewNumber = true;
        updateDisplay();
        return;
    }
}


// ボタンのクリックイベントリスナー
buttons.forEach(button => {
    button.addEventListener('click', () => {
        const value = button.getAttribute('data-value');
        const isOp = button.classList.contains('operator') || button.classList.contains('unary-op') || button.classList.contains('binary-op') || value === 'Enter';

        // 入力待ち状態で数字/ドットが押された場合、スタックリフトを実行
        if (waitingForNewNumber && !isOp && value !== '.') {
            const valueToPush = Number(currentInput); 
            stack.T = stack.Z; 
            stack.Z = stack.Y; 
            stack.Y = valueToPush; 
            currentInput = '0';
            waitingForNewNumber = false;
        }
        
        // 1. 数字ボタンが押されたとき
        if (button.classList.contains('number')) {
            if (value === '.') {
                if (currentInput.includes('.')) return;
                currentInput += '.';
            } else {
                if (currentInput === '0') {
                    currentInput = value;
                } else {
                    currentInput += value;
                }
            }
            waitingForNewNumber = false; 
        
        // 2. Enterボタンが押されたとき
        } else if (value === 'Enter') {
            if (currentInput === "Error") return;
            const valueToPush = Number(currentInput); 
            stack.T = stack.Z; 
            stack.Z = stack.Y; 
            stack.Y = valueToPush; 
            currentInput = String(valueToPush); 
            waitingForNewNumber = true;
        
        } else if (isOp) {
            // 3. 演算子ボタンが押されたとき

            if (['pow', 'sqrt', 'inv', 'fact', '+', '-', '*', '/'].includes(value)) {
                 if (!waitingForNewNumber && currentInput !== "Error") {
                    waitingForNewNumber = true;
                 }
                 performOperation(value);
                 return;
            }

            // 特殊なオペレーターの処理 (C, D, Swap)
            if (value === 'C') {
                stack.T = 0; stack.Z = 0; stack.Y = 0;
                currentInput = '0';
                waitingForNewNumber = true;
            } else if (value === 'D') {
                if (!waitingForNewNumber && currentInput !== "Error") {
                    currentInput = currentInput.slice(0, -1);
                    if (currentInput.length === 0 || currentInput === '-') {
                        currentInput = '0';
                        waitingForNewNumber = true;
                    }
                }
            } else if (value === 'Swap') {
                if (currentInput === "Error") return;
                const xTemp = Number(currentInput);
                currentInput = String(stack.Y);
                stack.Y = xTemp;
                waitingForNewNumber = true; 
            }
        }
        updateDisplay();
    });
});

// 初期表示
updateDisplay();