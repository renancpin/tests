// import fs from 'fs';

// import { join, dirname } from 'path';
// import { fileURLToPath } from 'url';

// function testFile() {
//     try {
//         const __dirname = dirname(fileURLToPath(import.meta.url));
//         const file = fs.createWriteStream(join(__dirname, 'layouts', 'output.txt'));

//         const textField = new Field('<nomeDoFundo>A(10)'),
//             textString = textField.parse('Nome do Fundo');
//         console.log(Field.parseString(textString, 15), textField);
//         file.write(textString);

//         const dateField = new Field('ddmmaaaa'),
//             dateString = dateField.parse(new Date());
//         console.log(Field.parseString(dateString, 15), dateField);
//         file.write(dateString);

//         const emptyField = new Field('A(10)(u)'),
//             emptyString = emptyField.parse('uPpERcASe');
//         console.log(Field.parseString(emptyString, 15), emptyField);
//         file.write(emptyString);

//         const numberField = new Field('n(0)(2)'),
//             numberString = numberField.parse(258.7);
//         console.log(Field.parseString(numberString, 15), numberField);
//         file.write(numberString);

//         file.close();
//     } catch (e) {
//         console.error('[ERROR]: '+e.message);
//     }
// }
