try {
  const i = { atestados: undefined };
  i.atestados.toString();
} catch (e) {
  console.log("If i.atestados is undefined: ", e.message);
}
try {
  const i = undefined;
  i.atestados.toString();
} catch (e) {
  console.log("If i is undefined: ", e.message);
}
