const line = "Predict -- $y_n+1^[P] $ --> Evaluate1E: Evaluate $f_n+1^[P] = ft_n+1, y_n+1^[P]$";

const arrowRegex = /((?:---|-->|--.*?-->)\s*)/;
console.log("Arrow match:", line.match(arrowRegex));

const nodeRegex = /((?:---|-->|--.*?-->)\s*)([a-zA-Z0-9_]+\b)/;
console.log("Node match:", line.match(nodeRegex));

const contentRegex = /((?:---|-->|--.*?-->)\s*)([a-zA-Z0-9_]+\b)\s*([^[\\n].*?)/;
console.log("Content match:", line.match(contentRegex));

const fullRegex = /((?:---|-->|--.*?-->)\s*)([a-zA-Z0-9_]+\b)\s*([^[\\n].*?)(;)/;
console.log("Full match:", line.match(fullRegex));
