const App = {

showScreen(id){

document.querySelectorAll('.screen').forEach(screen=>{
screen.classList.remove('active')
})

document.getElementById(id).classList.add('active')

},

selectRole(role){

localStorage.setItem("role", role)

this.showScreen("screen-dashboard")

}

speak(){

let text =
document.getElementById("tts-input").value

let speech =
new SpeechSynthesisUtterance(text)

speech.rate = 1

speechSynthesis.speak(speech)

}

}