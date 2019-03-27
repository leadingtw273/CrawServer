const regex = /^(?!Re: ).*\[(發案|團體)\](?!.*已徵到)(?!.*已結案)(?!.*已徵得).*(爬蟲|網站|web).*/gm;
const str = `[發案] PHP+mongo+rwd web`;
let m;

while ((m = regex.exec(str)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
        regex.lastIndex++;
    }
    console.log(m[1], m[2]);
}
