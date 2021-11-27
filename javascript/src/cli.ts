/**
 * @license
 * Copyright 2021 Google LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as readline from 'readline';
import {Command} from 'commander';
import {Parser, loadDefaultJapaneseParser} from './parser';

/**
 * Run the command line interface program.
 * @param argv process.argv.
 */
export const cli = async (argv: string[]) => {
  const program = new Command('budoxu');

  program.usage('[-h] [-H] [-m JSON] [-d STR] [-V] [TXT]');

  program
    .option('-H, --html', 'HTML mode')
    .option('-d, --delim <str>', 'output delimiter in TEXT mode', '---')
    .option('-m, --model <json>', 'custom model file path')
    .option('--debug');

  program.version('0.0.1');
  program.parse(argv);

  const options = program.opts();
  const {model, delim, html} = options as {
    html: boolean;
    delim: string;
    model: string;
  };
  const {args} = program;
  if (options.debug) console.log({options, args});

  const parser = model ? loadCustomParser(model) : loadDefaultJapaneseParser();

  if (args.length !== 0) {
    outputParsedTexts(parser, html, delim, args);
  } else {
    const rl = readline.createInterface({
      input: process.stdin,
    });

    let stdin = '';
    rl.on('line', line => {
      stdin += line + '\n';
    });
    process.stdin.on('end', () => {
      outputParsedTexts(parser, html, delim, [stdin]);
    });
  }
};

/**
 * Run the command line interface program.
 * @param parser A parser.
 * @param html A flag of html output mode.
 * @param delim A delimiter to separate output sentence.
 * @param args string array to parse.
 */
const outputParsedTexts = (
  parser: Parser,
  html: boolean,
  delim: string,
  args: string[]
) => {
  if (html) {
    args.forEach(text => {
      const output = parser.translateHTMLString(text);
      console.log(output);
    });
  } else {
    args.forEach(arg => {
      const splitedTextsByNewLine = arg
        .split(/\r?\n/)
        .filter(text => text !== '');
      splitedTextsByNewLine.forEach((text, index) => {
        const parsedTexts = parser.parse(text);
        parsedTexts.forEach(parsedText => {
          console.log(parsedText);
        });
        if (index + 1 !== splitedTextsByNewLine.length) console.log(delim);
      });
    });
  }
};

/**
 * Loads a parser equipped with custom model.
 * @returns A parser with the loaded model.
 */
const loadCustomParser = (path: string) => {
  const json = readFileSync(resolve(path));
  return new Parser(new Map(Object.entries(json)));
};
