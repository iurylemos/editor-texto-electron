const { ipcRenderer } = require('electron');

//ELEMENTOS
const textArea = document.getElementById('text');
const title = document.getElementById('title');

//SET FILE
ipcRenderer.on('set-file', function (event, data) {
  console.log(data);
  textArea.value = data.content;
  title.innerHTML = data.name + ' | IL EDITOR';
})

//Gerenciar atualização do textarea
//UPDATE TEXTAREA
function handleChangeText() {
  ipcRenderer.send('update-content', textArea.value)
}