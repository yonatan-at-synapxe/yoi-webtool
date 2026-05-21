/**
 * Web Utility Toolbox - Password & Token Generator Utility Logic
 */

Tools.generatePassword = function(length, opts) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let charPool = '';
    if (opts.lowercase) charPool += lowercase;
    if (opts.uppercase) charPool += uppercase;
    if (opts.numbers) charPool += numbers;
    if (opts.symbols) charPool += symbols;

    if (charPool === '') {
        return { password: '', strength: 0, status: 'Select at least one option' };
    }

    let password = '';
    const randomValues = new Uint32Array(length);
    window.crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
        const randomIndex = randomValues[i] % charPool.length;
        password += charPool[randomIndex];
    }

    // Calculate strength metric
    let strength = 0;
    let checks = 0;
    if (opts.lowercase && /[a-z]/.test(password)) checks++;
    if (opts.uppercase && /[A-Z]/.test(password)) checks++;
    if (opts.numbers && /[0-9]/.test(password)) checks++;
    if (opts.symbols && /[^A-Za-z0-9]/.test(password)) checks++;
    
    strength = checks;
    if (length >= 12) strength += 1;
    if (length >= 16) strength += 1;

    let status = 'Weak';
    let statusClass = 'error';
    if (strength >= 5) {
        status = 'Very Strong';
        statusClass = 'success';
    } else if (strength >= 4) {
        status = 'Strong';
        statusClass = 'success';
    } else if (strength >= 3) {
        status = 'Medium';
        statusClass = 'warning';
    }

    return {
        password: password,
        strength: strength, // 0 to 6 max
        status: status,
        statusClass: statusClass
    };
};
