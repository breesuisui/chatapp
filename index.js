// Simple chat application starting code taken from
// https://github.com/socketio/socket.io/tree/master/examples/chat

let express = require("express")
let app = express()
let path = require("path")
let http = require("http").createServer(app)
let cookie = require("cookie")
let io = require("socket.io")(http)
const port = 51900

// serve static files using absolute path
app.use(express.static(path.join(__dirname, "public")))

// Fisher–Yates array shuffle algorithm
// source: https://bost.ocks.org/mike/shuffle/
function shuffle(arr) {
  let i = arr.length,
    temp,
    r
  while (i) {
    r = Math.floor(Math.random() * i--)
    temp = arr[i]
    arr[i] = arr[r]
    arr[r] = temp
  }
  return arr
}

// 78 animal names
// source: https://www.quora.com/What-is-the-complete-list-of-anonymous-creatures-one-can-be-labeled-as-when-using-Google-Docs
const ANIMALS = shuffle(
  [
    "Alligator",
    "Anteater",
    "Armadillo",
    "Auroch",
    "Axolotl",
    "Badger",
    "Bat",
    "Beaver",
    "Buffalo",
    "Camel",
    "Chameleon",
    "Cheetah",
    "Chipmunk",
    "Chinchilla",
    "Chupacabra",
    "Cormorant",
    "Coyote",
    "Crow",
    "Dingo",
    "Dinosaur",
    "Dog",
    "Dolphin",
    "Dragon",
    "Duck",
    "Dumbo Octopus",
    "Elephant",
    "Ferret",
    "Fox",
    "Frog",
    "Giraffe",
    "Goose",
    "Gopher",
    "Grizzly",
    "Hamster",
    "Hedgehog",
    "Hippo",
    "Hyena",
    "Jackal",
    "Ibex",
    "Ifrit",
    "Iguana",
    "Kangaroo",
    "Koala",
    "Kraken",
    "Lemur",
    "Leopard",
    "Liger",
    "Lion",
    "Llama",
    "Manatee",
    "Mink",
    "Monkey",
    "Moose",
    "Narwhal",
    "Nyan Cat",
    "Orangutan",
    "Otter",
    "Panda",
    "Penguin",
    "Platypus",
    "Python",
    "Pumpkin",
    "Quagga",
    "Rabbit",
    "Raccoon",
    "Rhino",
    "Sheep",
    "Shrew",
    "Skunk",
    "Slow Loris",
    "Squirrel",
    "Tiger",
    "Turtle",
    "Unicorn",
    "Walrus",
    "Wolf",
    "Wolverine",
    "Wombat",
  ].map((x) => "Anonymous " + x)
)

// 76 material design colors -> reduced to 19 for contrast
// source: https://www.materialui.co/colors
const COLORS = shuffle([
  "#FFCDD2",
  "#F8BBD0",
  "#E1BEE7",
  "#D1C4E9",
  "#C5CAE9",
  "#BBDEFB",
  "#B3E5FC",
  "#B2EBF2",
  "#B2DFDB",
  "#C8E6C9",
  "#DCEDC8",
  "#F0F4C3",
  "#FFF9C4",
  "#FFECB3",
  "#FFE0B2",
  "#FFCCBC",
  "#D7CCC8",
  "#F5F5F5",
  "#CFD8DC",
  // "#EF9A9A", "#F48FB1", "#CE93D8", "#B39DDB", "#9FA8DA", "#90CAF9", "#81D4FA", "#80DEEA", "#80CBC4", "#A5D6A7", "#C5E1A5", "#E6EE9C", "#FFF59D", "#FFE082", "#FFCC80", "#FFAB91", "#BCAAA4", "#EEEEEE", "#B0BEC5",
  // "#E57373", "#F06292", "#BA68C8", "#9575CD", "#7986CB", "#64B5F6", "#4FC3F7", "#4DD0E1", "#4DB6AC", "#81C784", "#AED581", "#DCE775", "#FFF176", "#FFD54F", "#FFB74D", "#FF8A65", "#A1887F", "#E0E0E0", "#90A4AE",
  // "#EF5350", "#EC407A", "#AB47BC", "#7E57C2", "#5C6BC0", "#42A5F5", "#29B6F6", "#26C6DA", "#26A69A", "#66BB6A", "#9CCC65", "#D4E157", "#FFEE58", "#FFCA28", "#FFA726", "#FF7043", "#8D6E63", "#BDBDBD", "#78909C"
])

class User {
  constructor(id, name, color) {
    this.id = id || userIndex++

    // set unique random name
    do {
      if (name) {
        this.name = name
      } else {
        this.name = ANIMALS[animalIndex]
        animalIndex = (animalIndex + 1) % ANIMALS.length
      }
      name = ""
    } while (connectedUsers.hasOwnProperty(name))

    this.color = color || COLORS[colorIndex++]
    colorIndex = (colorIndex + 1) % COLORS.length

    connectedUsers[this.name] = this
    return this
  }

  changeName(name) {
    if (name != "" && !connectedUsers.hasOwnProperty(name)) {
      // update entry and change name
      delete connectedUsers[this.name]
      this.name = name
      connectedUsers[this.name] = this
      return true
    }
    return false
  }

  changeColor(color) {
    // verify that color is valid
    let validHex = RegExp(/^[\dA-Fa-f]{6}$/)
    if (validHex.test(newColor)) {
      this.color = "#" + color
      return true
    }
    return false
  }

  deactivate() {
    delete connectedUsers[this.name]
  }
}

class Message {
  constructor(txt, user) {
    this.txt = txt
    this.color = user.color
    this.uname = user.name
    this.uid = user.id
    this.time = Date.now()
  }
}
Message.prototype.toString = function () {
  let date = new Date(msg.time)
  let time = ("0" + date.getHours()).substr(-2) + ":" + ("0" + date.getMinutes()).substr(-2)
  return time + " " + this.uname + ": " + this.txt
}

const maxUsers = Math.min(ANIMALS.length, COLORS.length)
const maxLogEntries = 10
let colorIndex = 0
let animalIndex = 0
let userIndex = 0
let connectedUsers = {}
let chatLog = []

io.on("connection", (socket) => {
  // connect
  let user
  try {
    // try to restore existing user
    cookieData = cookie.parse(socket.request.headers.cookie)
    user = new User(cookieData.id, cookieData.name, cookieData.color)
    let reactivated = user.name == cookieData.name
    console.log(user.name + (reactivated ? " has returned!" : " joined"))
  } catch (e) {
    // create a new one if that fails
    user = new User()
    console.log(user.name + " joined")
  }

  // save user data in a cookie
  socket.emit("connected", user)
  updateUserList()
  sendMessageHistory()

  // receive message
  socket.on("chat message", (txt) => {
    msg = new Message(txt, user)
    chatLog.push(msg)
    chatLog.slice(chatLog.length - maxLogEntries)

    // check for name change
    if (txt.startsWith("/name ")) {
      oldName = user.name
      newName = txt.split(" ").slice(1).join(" ")
      if (user.changeName(newName)) {
        updateUserList()
        socket.emit("update", user)
        updateChatLog(user.id, "uname", newName)
        console.log(oldName + " changed name to " + newName)
      }
      // check for color change
    } else if (txt.startsWith("/color ")) {
      oldColor = user.color
      newColor = txt.split(" ")[1]
      if (user.changeColor(newColor)) {
        updateChatLog(user.id, "color", "#" + newColor)
        console.log(user.name + " changed color from " + oldColor + " to #" + newColor)
      }
    }
    io.emit("chat message", chatLog)
  })

  // disconnect
  socket.on("disconnect", () => {
    user.deactivate()
    updateUserList()
    console.log(user.name + " has left...")
  })

  // update user list
  function updateUserList() {
    io.emit("update users", connectedUsers)
  }

  function sendMessageHistory() {
    socket.emit("chat message", chatLog)
  }

  function updateChatLog(uid, key, newValue) {
    chatLog.forEach((msg) => {
      if (msg.uid === uid) {
        msg[key] = newValue
      }
    })
  }
})

// listen for new connections
http.listen(port, () => {
  console.log("listening on *:" + port)
})
