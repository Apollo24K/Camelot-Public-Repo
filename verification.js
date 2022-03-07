// Here are some examples from our code!

// Example 1: The search function
// With the search command anyone can search for characters in our database. Here's the function that will find the character you're looking for, even if you don't provide its whole name!
function search(name) {
  name = name.toLowerCase();
  if (name === "last" || name === "latest") name = inventory[message.author.id + message.guild.id][inventory[message.author.id + message.guild.id].length -1].toString();

  if (!isNaN(name)) {
    if (name < 0) return message.channel.send("The ID can't be negative.");
    if (name >= characters.length) return message.channel.send("The ID must be smaller than " + characters.length);
    if (!(name[0] === "0" && name.length > 1)) return characters[parseInt(name)];
  };

  let cArgs = name.split(" ");

  let fastCheck = characters.filter((e) => e.name.toLowerCase() === cArgs.join(' ') || e.alias.some((a) => a.toLowerCase() === cArgs.join(' ')));
  if (fastCheck[0] !== undefined) return fastCheck[0];

  let fArray = characters.filter((e) => e.name.toLowerCase()[0] === cArgs[0][0] || e.alias.some((a) => a.toLowerCase()[0] === cArgs[0][0]));

  let letter = 0;
  for (word=0; word < cArgs.length; word++) {
    let { length:wl } = cArgs[word];

    while (wl--) {
      fArray = fArray.filter((e) => e.name.toLowerCase().split(" ")[word] === undefined ? false :  e.name.toLowerCase().split(" ")[word][letter] === cArgs[word][letter] || e.alias.some((a) => a.toLowerCase()[letter] === cArgs[word][letter]));
      letter++;
    };

    if (fArray.length < 2) break;
    letter = 0;
  };

  if (fArray.length === 0) return message.channel.send("No match found");
  if (fArray.length > 1) return message.channel.send(fArray.length + " matches found");
  return fArray[0];
};

// Example usage with the user input "Rimuru Tempest":
let input = "Rimuru Tempest";
let char = search(input);
// And that's it! search() will return the character object we can then use to display it or do all kinds of other things we need to. And if there is no match fitting the input it will send a warning message



// Example 2: Base stats
// Every character has their own unique values as their base stats for the dungeon. Here's how we're calculating them without needing to store anything!
function strCode(id) {
  let inp = characters[id].anime + characters[id].gender + characters[id].name;
  if (seed[message.guild.id]) inp += seed[message.guild.id];
  let hash = 0;
  if (inp.length < 2) return 111;
  for (i=0; i < inp.length; i++) {
    let char = inp.charCodeAt(i);
    hash = ((hash<<5)-hash)+char;
    hash = hash & hash; // Convert to 32bit integer
  };
  if (hash < 0) return -hash;
  return hash;
};

function baseHP(id) {
  let hash = strCode(id) % 10;
  switch (characters[id].rarity) {
   case "SS" : hash = Math.round(180 + (6*hash)); break;
   case "S" : hash = Math.round(150 + (5*hash)); break;
    case "A" : hash = Math.round(120 + (6*hash)); break;
    case "B" : hash = Math.round(100 + (5*hash)); break;
    case "C" : hash = Math.round(80 + (4*hash)); break;
    case "D" : hash = Math.round(70 + (3*hash)); break;
    default : hash = 1; break;
  };
  return hash;
};



// Example 3: The pull command
// Here's the code for our most used command
if (cmd === "p" || cmd === "pull") {
  if (!inventory[message.author.id + message.guild.id]) inventory[message.author.id + message.guild.id] = [];
  if (!pity[message.author.id + message.guild.id]) pity[message.author.id + message.guild.id] = { pullsTotal: 0, lastSS: 0, lastS: 0, };
  if (!ref[message.author.id + message.guild.id]) ref[message.author.id + message.guild.id] = {};
  if (!pullCount[message.author.id + message.guild.id] && pullCount[message.author.id + message.guild.id] !== 0) pullCount[message.author.id + message.guild.id] = 0;
  if (!xp[message.author.id + message.guild.id]) xp[message.author.id + message.guild.id] = 0;

  // Check if the user can vote
  let canVote = `\nYou can **${prefix}vote** now! To reset your pull counter (use \`!rp\` after the vote)`;
  var lastVote = JSON.parse(fs.readFileSync('Storage/lastVote.json', 'utf8'));
  if (lastVote[message.author.id] && ((new Date().getTime() - lastVote[message.author.id]) < 12*60*60*1000)) canVote = "";

  // Check if the user has used all of his pulls this interval
  let pullLimit = 6;
  if (pullCount[message.author.id + message.guild.id] >= pullLimit) {
    let time = new Date();
    let nextPull = time.getHours() % 2 === 0 ? Math.ceil(time/3600000)*3600000 + 3600000 : Math.ceil(time/3600000)*3600000;
    let timeLeft = nextPull - time;
    if (timeLeft > 7200000 - 60000) return message.channel.send(`You've reached your pull limit, please wait **2**h` + canVote);
    return message.channel.send(`You've reached your pull limit, please wait ${timeLeft > 3600000 ? "**1**h " : ""}**${timeLeft > 3600000 ? Math.ceil((timeLeft - 3600000)/60000) : Math.ceil((timeLeft)/60000)}** min` + canVote);
  };
  pullCount[message.author.id + message.guild.id]++;
  
  let ranRar = Math.floor(Math.random() * 1000); // 0-999

  // Pity; if the player does not pull any S or SS tier characters for a while, their 80th or 210th pulls will be an S or SS respectively
  pity[message.author.id + message.guild.id].pullsTotal++;
  if (ranRar > 2) pity[message.author.id + message.guild.id].lastSS++;
  if (ranRar > 20) pity[message.author.id + message.guild.id].lastS++;
  
  if (pity[message.author.id + message.guild.id].lastS >= sPit && pity[message.author.id + message.guild.id].lastSS >= ssPit) { ranRar = 1; pity[message.author.id + message.guild.id].lastS--; pity[message.author.id + message.guild.id].lastSS = 0 };
  if (pity[message.author.id + message.guild.id].lastS >= sPit) { ranRar = 10; pity[message.author.id + message.guild.id].lastS = 0 };
  if (pity[message.author.id + message.guild.id].lastSS >= ssPit) { ranRar = 1; pity[message.author.id + message.guild.id].lastSS = 0 };

  // Calculate XP
  const ranXp = Math.ceil(Math.random() * 10); // 1-10
  xp[message.author.id + message.guild.id] += ranXp;
  if (ranRar < 21 && ranRar > 2) xp[message.author.id + message.guild.id] += ranXp;
  if (ranRar < 3) xp[message.author.id + message.guild.id] += 20;
    
  // Decide on a Rarity
  let rar = "D";
  if (ranRar < 3) rar = "SS", pity[message.author.id + message.guild.id].lastSS = 0;
  else if (ranRar < 21) rar = "S", pity[message.author.id + message.guild.id].lastS = 0;
  else if (ranRar < 63) rar = "A";
  else if (ranRar < 189) rar = "B";
  else if (ranRar < 442) rar = "C";
  
  // Pick a character
  let fChars = characters.filter((e) => e.rarity === rar);
  let num = Math.floor(Math.random() * fChars.length);
  inventory[message.author.id + message.guild.id].push(fChars[num].id);
  if (!ref[message.author.id + message.guild.id][fChars[num].id]) ref[message.author.id + message.guild.id][fChars[num].id] = 0;
  ref[message.author.id + message.guild.id][fChars[num].id]++;
  
  // Show the character on discord
  displayPull(fChars[num], pullLimit);
};









