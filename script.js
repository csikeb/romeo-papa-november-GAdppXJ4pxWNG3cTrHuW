const display = document.getElementById('display');
const buttons = document.querySelectorAll('.button');
const stackView = document.getElementById('stack-view'); 

// 4つのレジスタを定義
// T, Z, Y はオブジェクトのプロパティとして保持
let stack = {
    T: 0, 
    Z: 0, 
    Y: 0 
};
let currentInput = '0'; // Xレジスタの役割
let waitingForNewNumber = true; 

// 階乗を計算するヘルパー関数
function factorial(n) {
    const num = Number(n);
    // 負の数、小数、または 21 以上の整数は精度超過としてエラーにする
    // 21! は Number.MAX_SAFE_INTEGER を超える
    if (num < 0 || num !== Math.floor(num) || num > 20) {
        return "Error"; 
    }
    if (num === 0) {
        return 1;
    }
    let res = 1;
    for (let i = 2; i <= num; i++) {
        res *= i;
        // 念のため、計算中に MAX_SAFE_INTEGER を超えたらエラー
        if (res > Number.MAX_SAFE_INTEGER) {
             return "Error"; 
        }
    }
    return res;
}

// スタックの全内容をHTMLに表示する関数
function updateStackView() {
    // レジスタの値を直接参照
    const t = stack.T;
    const z = stack.Z;
    const y = stack.Y;
    const x = currentInput; // Xレジスタ

    /*
    stackView.innerHTML = `
        T: ${String(t).substring(0, 15)}<br>
        Z: ${String(z).substring(0, 15)}<br>
        Y: ${String(y).substring(0, 15)}<br>
        <span style="font-weight: bold;">X: ${String(x).substring(0, 15)}</span>
    `;
    */
}

// 画面表示を更新する関数
function updateDisplay() {
    // Xレジスタ（currentInput）をそのまま表示する
    const displayValue = currentInput;

    display.value = String(displayValue).substring(0, 15);
    
    updateStackView();
}

// 演算を実行し、結果をレジスタに入れる関数
function performOperation(op) {
    // Xレジスタの値を数値として取得
    const xValue = Number(currentInput);
    
    // 二項演算子 (+, -, *, /, pow) の処理
    if (['+', '-', '*', '/', 'pow'].includes(op)) {
        
        // T保持のための元のTの値を取得
        const tValueToRetain = stack.T; 
        
        // YとXのオペランド
        const operand1 = stack.Y; // Yレジスタの値
        const operand2 = xValue;  // Xレジスタの値 (currentInput)

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
            
            // 【スタックドロップ処理 (T保持)】
            // 1. Tレジスタは元の値を保持
            stack.T = tValueToRetain;
            
            // 2. ZレジスタはTレジスタの値（元のTの値）を引き継ぐ
            stack.Z = tValueToRetain; 
            
            // 3. YレジスタにはZレジスタの値（元のTの値）がドロップする。
            stack.Y = stack.Z; 
            
            // 4. Xレジスタ (currentInput) に計算結果を代入
            currentInput = String(result); 
        } else {
             // isFinite(result) が false の場合 (Infinity, -Infinity) も Error 処理
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
        
        // Xレジスタの値をオペランドとする
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
                result = factorial(operand); // 修正された factorial 関数を呼び出す
                break;
            default: return;
        }

        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
            
            // 単項演算ではXレジスタが結果で上書きされるのみ。
            currentInput = String(result);
        } else {
            // Error の場合
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
            
            // Xレジスタの現在の値（前の計算結果など）を取得
            const valueToPush = Number(currentInput); 
            
            // スタックリフト処理 (X -> Y -> Z -> T -> 破棄)
            stack.T = stack.Z; 
            stack.Z = stack.Y; 
            stack.Y = valueToPush; 
            
            // Xレジスタを新しい入力のために '0' にリセット
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

            // Xレジスタ（currentInput）の現在の値を数値として取得
            const valueToPush = Number(currentInput); 

            // スタックリフト処理 (X -> Y -> Z -> T -> 破棄)
            stack.T = stack.Z; 
            stack.Z = stack.Y; 
            stack.Y = valueToPush; // YはXの値（プッシュ値）になる
            
            // Xレジスタはプッシュした値（Yの値）を複製し、保持する
            currentInput = String(valueToPush); 
            
            // Enter後は入力待ち状態
            waitingForNewNumber = true;
        
        } else if (isOp) {
            // 3. 演算子ボタンが押されたとき

            if (['pow', 'sqrt', 'inv', 'fact', '+', '-', '*', '/'].includes(value)) {
                 if (!waitingForNewNumber && currentInput !== "Error") {
                    // Xは operand2 としてそのまま performOperation に渡される
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
                
                // YとXの値を入れ替える
                const xTemp = Number(currentInput);
                currentInput = String(stack.Y);
                stack.Y = xTemp;
                
                waitingForNewNumber = true; // Swap後は入力待ち状態
            }
        }
        updateDisplay();
    });
});

// 初期表示
updateDisplay();