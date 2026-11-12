/* 随机答题 10 万次，检查八种猫的结果分布是否合理。 */
const data = require('../data.js');
const { computeResult } = require('../scoring.js');

const runs = 100000;
const counts = {};
const matchValues = [];
const scores = {};
const dimMin = {};
const dimMax = {};

for (let i = 0; i < runs; i += 1) {
  const answers = data.questions.map((q) => Math.floor(Math.random() * q.options.length));
  const result = computeResult(answers, data);
  counts[result.type.id] = (counts[result.type.id] || 0) + 1;
  matchValues.push(result.match);
  if (!scores[result.type.id]) scores[result.type.id] = [];
  scores[result.type.id].push(result.match);
  Object.keys(result.scores).forEach((k) => {
    dimMin[k] = Math.min(dimMin[k] ?? 101, result.scores[k]);
    dimMax[k] = Math.max(dimMax[k] ?? 0, result.scores[k]);
  });
}

console.log('结果分布（随机答题）');
Object.keys(data.types).forEach((id) => {
  const arr = scores[id] || [];
  const avg = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  console.log(
    `${data.types[id].name.padEnd(4, '　')} ${((counts[id] || 0) / runs * 100).toFixed(1).padStart(5)}%  ` +
      `命中均分 ${avg.toFixed(1)}`
  );
});

matchValues.sort((a, b) => a - b);
console.log('\n匹配度', {
  min: matchValues[0],
  p10: matchValues[Math.floor(runs * 0.1)],
  median: matchValues[Math.floor(runs * 0.5)],
  p90: matchValues[Math.floor(runs * 0.9)],
  max: matchValues[runs - 1],
});
console.log('维度范围', dimMin, dimMax);

// 固定「全选 A」到「全选 D」的四个极端结果
console.log('\n固定答案结果');
for (let a = 0; a < 4; a += 1) {
  const answers = data.questions.map(() => a);
  const r = computeResult(answers, data);
  console.log(String.fromCharCode(65 + a), r.type.name, r.match, r.scores);
}
