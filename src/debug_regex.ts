const line = "Predict -- $y_n+1^[P] $ --> Evaluate1E: Evaluate $f_n+1^[P] = ft_n+1, y_n+1^[P]$";;
const regex = /((?:---|-->|--.*?-->)\s*)([a-zA-Z0-9_]+\b)\s*([^\[\n].*?)(;)/g;

const match = regex.exec(line);
console.log("Match:", match);
if (match) {
    console.log("Replaced:", line.replace(regex, '$1$2[$3]$4'));
} else {
    console.log("No match");
}

