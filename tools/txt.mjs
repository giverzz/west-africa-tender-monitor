import fs from 'node:fs';
const [f, re, n = 40] = process.argv.slice(2);
let h = fs.readFileSync(f, 'utf8');
h = h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<a [^>]*href="([^"]*)"[^>]*>/gi, ' [$1] ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, "'").replace(/[ \t]+/g, ' ');
const lines = h.split(/\n/).map((l) => l.trim()).filter((l) => l.length > 3);
const out = re ? lines.filter((l) => new RegExp(re, 'i').test(l)) : lines;
console.log(out.slice(0, +n).map((l) => l.slice(0, 300)).join('\n'));
