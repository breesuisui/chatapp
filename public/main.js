$(function () {
  let socket = io()
  let id = null

  // helper function to update cookies and client state
  function update(userData) {
    // update cookie
    document.cookie = "id=" + userData.id
    document.cookie = "name=" + userData.name
    document.cookie = "color=" + userData.color

    // update client state
    id = userData.id
    $("#username").text(userData.name)
  }

  function renderMesLists(msgLists) {
    msgLists.forEach((msg) => {
      // format time from unix UTC timestamp
      let date = new Date(msg.time)
      let time = ("0" + date.getHours()).substr(-2) + ":" + ("0" + date.getMinutes()).substr(-2)

      // color name
      let uname = $("<span>").text(msg.uname).css("color", msg.color)
      msg.txt = msg.txt.replace(/:\)/g, "&#128513;")
      msg.txt = msg.txt.replace(/:\(/g, "&#128543;")
      msg.txt = msg.txt.replace(/:o/g, "&#128559;")

      let li = $("<li>")
      li.append(time + " ")
      li.append(uname)
      li.append(": " + msg.txt)

      // add bold if message is from this user
      if (msg.uid == id) {
        li.wrapInner("<b>")
      }
      $(".messages.content").append(li)
    })
  }

  // successfully connected to server
  socket.on("connected", (userData) => {
    update(userData)
    $(".messages.content").empty()
    // $(".messages.content").append($("<li>").text("You are " + userData.name + "."))
  })

  // user data has changed (e.g. name or color)
  socket.on("update", (userData) => {
    update(userData)
  })

  // send message to server
  $("form").submit(() => {
    socket.emit("chat message", $("#m").val())
    $("#m").val("")
    return false
  })

  // display incoming message
  socket.on("chat message", (msgLists) => {
    $(".messages.content").empty()
    console.log(msgLists)
    renderMesLists(msgLists)
    // move scrollbar down
    $(".messages.content").scrollTop($(".messages.content")[0].scrollHeight)
  })

  // reload user list
  socket.on("update users", (users) => {
    $(".users.content").empty()
    for (userKey in users) {
      if (users[userKey].id === id) {
        userKey += "（you）"
        $(".users.content").prepend($("<li>").text(userKey).css("fontWeight", "bold"))
      } else {
        $(".users.content").append($("<li>").text(userKey))
      }
    }
  })
})
