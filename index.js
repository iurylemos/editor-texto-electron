const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const fs = require('fs');
const path = require('path');

//JANELA PRINCIPAL
let mainWindow = null;
async function createWindow() {
  console.log('create');
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const caminhoIndex = path.join(__dirname, 'src', 'pages', 'editor', 'index.html');
  await mainWindow.loadFile(caminhoIndex);

  mainWindow.webContents.openDevTools();
  createNewFile();

  //LISTENER PARA RECEBER EVENTO DO TEXTAREA QUE ESTÁ SENDO ENVIADO DO SCRIPT.JS

  ipcMain.on('update-content', function (event, data) {
    file.content = data;
  })

}

//Salvar ARQUIVO no DISCO
function writeFile(filePath) {
  try {
    fs.writeFile(filePath, file.content, function (error) {
      if (error) throw error;

      //ARQUIVO SALVO
      file.path = filePath;
      file.saved = true;
      file.name = path.basename(filePath);

      //Enviando para o renderizador novamente, atualizar o nome do arquiv
      mainWindow.webContents.send('set-file', file);
    })
  } catch (error) {
    console.log(error);
  }
}

//ARQUIVO
let file = {};

//LER ARQUIVO
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.log(error);
    return '';
  }
}

//RESPONSÁVEL POR ABRIR UM ARQUIVO
async function openFile() {
  const dialogFile = await dialog.showOpenDialog({
    defaultPath: file.path
  });

  //VERIFICAR CANCELAMENTO?
  if (dialogFile.canceled) return false;

  //ABRIR ARQUIVO
  file = {
    name: path.basename(dialogFile.filePaths[0]),
    content: readFile(dialogFile.filePaths[0]),
    saved: true,
    path: dialogFile.filePaths[0]
  }

  mainWindow.webContents.send('set-file', file);
}

//RESPONSÁVEL POR CRIAR UM NOVO ARQUIVO
function createNewFile() {
  file = {
    name: 'novo-arquivo.txt',
    content: '',
    saved: false,
    path: app.getPath('documents') + '/novo-arquivo.txt'
  };
  console.log(file);
  //ENVIANDO UMA MENSAGEM PARA O PROCESSO RENDERIZADOR
  mainWindow.webContents.send('set-file', file);
}

//RESPONSÁVEL POR SALVAR O ARQUIVO COMO.. 
async function saveFileAs() {
  //Resultado da caixa de dialogo
  const dialogFile = await dialog.showSaveDialog({
    defaultPath: file.path
  })

  //Verificar cancelamento
  if (dialogFile.canceled) {
    return false;
  }

  writeFile(dialogFile.filePath);
}

//RESPONSÁVEL POR SALVAR O ARQUIVO
async function saveFile() {
  if (file.saved) {
    return writeFile(file.path);
  }

  //SE NÃO TIVER SIDO SALVO, VAI SALVAR COMO
  return saveFileAs();
}

//TEMPLATE MENU
const templateMenu = [
  {
    label: 'Arquivo',
    submenu: [
      {
        label: 'Novo',
        accelerator: 'CmdOrCtrl+N',
        click() {
          createNewFile();
        }
      },
      {
        label: 'Abrir',
        accelerator: 'CmdOrCtrl+O',
        click() {
          openFile();
        }
      },
      {
        label: 'Salvar',
        accelerator: 'CmdOrCtrl+S',
        click() {
          saveFile()
        }
      },
      {
        label: 'Salvar como',
        accelerator: 'CmdOrCtrl+Shift+O',
        click() {
          saveFileAs();
        }
      },
      {
        label: 'Fechar',
        role: process.platform === 'darwin' ? 'close' : 'quit'
      }
    ]
  },
  {
    label: 'Editar',
    submenu: [
      {
        label: 'Desfazer',
        role: 'undo'
      },
      {
        label: 'Refazer',
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        label: 'Copiar',
        role: 'copy'
      },
      {
        label: 'Cortar',
        role: 'cut'
      },
      {
        label: 'Colar',
        role: 'paste'
      }
    ]
  },
  {
    label: 'Ajuda',
    submenu: [
      {
        label: 'Canal WDEV',
        click() {
          shell.openExternal('https://youtube.com')
        }
      }
    ]
  }
];

//MENU
const menu = Menu.buildFromTemplate(templateMenu);
Menu.setApplicationMenu(menu);

//ON READY
app.whenReady().then(createWindow);

//ACTIVATE
app.on('activate', function () {
  //Verificar se preciso criar ou se já está criada a janela
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
})