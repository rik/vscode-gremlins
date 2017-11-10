var vscode = require('vscode')

const gremlinsConfig = [
  {
    char: '200b',
    width: 0,
    message: 'zero width space',
  },
  {
    char: '00a0',
    width: 1,
    message: 'non breaking space',
  },
  {
    char: '201c',
    width: 1,
    message: 'left double quotation mark',
    backgroundColor: 'rgba(255,127,80,.5)',
    overviewRulerColor: 'rgba(255,127,80,1)',
  },
  {
    char: '201d',
    width: 1,
    message: 'right double quotation mark',
    backgroundColor: 'rgba(255,127,80,.5)',
    overviewRulerColor: 'rgba(255,127,80,1)',
  },
]

function activate(context) {
  const lightIcon = {
    gutterIconPath: context.asAbsolutePath('images/gremlins-light.svg'),
    gutterIconSize: 'contain',
  }
  const darkIcon = {
    gutterIconPath: context.asAbsolutePath('images/gremlins-dark.svg'),
    gutterIconSize: 'contain',
  }

  const diagnosticCollection = vscode.languages.createDiagnosticCollection(
    'Gremlins',
  )

  vscode.workspace.onDidOpenTextDocument(
    event => {
      console.log('openDocument')
      updateDecorations(vscode.window.activeTextEditor)
    },
    null,
    context.subscriptions,
  )

  vscode.workspace.onDidChangeTextDocument(
    event => {
      console.log('changeDocument')
      updateDecorations(vscode.window.activeTextEditor)
    },
    null,
    context.subscriptions,
  )

  const gremlins = gremlinsConfig.map(gremlin => {
    const regex = new RegExp(`\\u${gremlin.char}+`, 'g')
    let decorationType
    switch (gremlin.width) {
      case 0:
        decorationType = vscode.window.createTextEditorDecorationType({
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: gremlin.borderColor || 'darkred',
          overviewRulerColor: gremlin.overviewRulerColor || 'darkred',
          overviewRulerLane: vscode.OverviewRulerLane.Right,
          light: lightIcon,
          dark: darkIcon,
        })
        break
      case 1:
        decorationType = vscode.window.createTextEditorDecorationType({
          backgroundColor: gremlin.backgroundColor || 'rgba(255,128,128,.5)',
          overviewRulerColor: gremlin.overviewRulerColor || 'darkred',
          overviewRulerLane: vscode.OverviewRulerLane.Right,
          light: lightIcon,
          dark: darkIcon,
        })
        break
      default:
        break
    }

    return Object.assign({}, gremlin, { decorationType, regex })
  })

  function updateDecorations(activeTextEditor) {
    if (!activeTextEditor) {
      return
    }

    const doc = activeTextEditor.document

    const diagnostics = []

    for (const gremlin of gremlins) {
      const decorationOption = []

      for (let lineNum = 0; lineNum < doc.lineCount; lineNum++) {
        let lineText = doc.lineAt(lineNum)
        let line = lineText.text

        let match
        while ((match = gremlin.regex.exec(line))) {
          let startPos = new vscode.Position(lineNum, match.index)
          let endPos = new vscode.Position(
            lineNum,
            match.index + match[0].length,
          )
          const range = new vscode.Range(startPos, endPos)
          const message =
            match[0].length +
            ' ' +
            gremlin.message +
            (match[0].length > 1 ? 's' : '') +
            ' (unicode U+' +
            gremlin.char +
            ') here'

          const decoration = {
            range,
            hoverMessage: message,
          }
          decorationOption.push(decoration)

          diagnostics.push(new vscode.Diagnostic(range, message))
        }
      }

      // activeTextEditor.setDecorations(gremlin.decorationType, decorationOption)
    }

    diagnosticCollection.set(doc.uri, diagnostics)
  }

  updateDecorations(vscode.window.activeTextEditor)
}
exports.activate = activate

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate
