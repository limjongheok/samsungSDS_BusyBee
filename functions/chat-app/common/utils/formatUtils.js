function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}.${
    date.getMonth() + 1
  }.${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
}

module.exports = { formatTimestamp };
