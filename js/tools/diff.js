/**
 * Web Utility Toolbox - Text Diff Utility Logic
 */

Tools.diffLines = function(text1, text2) {
    const lines1 = (text1 || '').split(/\r?\n/);
    const lines2 = (text2 || '').split(/\r?\n/);
    const m = lines1.length;
    const n = lines2.length;

    // DP Table to find LCS
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (lines1[i - 1] === lines2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    const result = [];
    let i = m, j = n;

    // Backtracking logic to build diff arrays
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
            result.unshift({ type: 'unchanged', text: lines1[i - 1], line1: i, line2: j });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            result.unshift({ type: 'added', text: lines2[j - 1], line2: j });
            j--;
        } else {
            result.unshift({ type: 'removed', text: lines1[i - 1], line1: i });
            i--;
        }
    }

    return result;
};
