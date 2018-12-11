import axios from 'axios';
import * as git from 'simple-git/promise';
import * as uuid from 'uuid/v4';
import * as fs from 'graceful-fs';
import * as crypto from 'crypto';
import * as diff from 'diff';
import * as path from 'path';
import { exec as _exec } from 'child_process';


function getPackageVersionUrl(packageName: string, version: string) {
    return `http://registry.npmjs.com/${packageName}/${version}`;
}

export async function checkPackages(packagesToCheck: { packageName: string, versions: string[] }[]) {
    for (let { packageName, versions } of packagesToCheck) {
        for (let version of versions) {
            const url = getPackageVersionUrl(packageName, version);

            const packageData = await getJSON(url);

            if (!packageData.repository) {
                throw new Error(`Invalid 'package.repository' value, should be an object with keys 'type' and 'url'`);
            }

            const { repository } = packageData;
            if (repository.type !== 'git') {
                throw new Error(`Invalid repository type [${repository.type}], we currently only support git`);
            }

            const dirPath = await getTmpDir(packageName);

            try {
                const gitPath = path.join(dirPath, 'git');
                await mkdir(gitPath);
                const npmPath = path.join(dirPath, 'npm');
                await mkdir(npmPath);

                console.info(`Preparing package from Git [${repository.url}][tag=${version}] -> [${gitPath}]`);
                await cloneVersionToDir(repository.url, version, gitPath);
                console.info(`Building project ([npm run build])`);

                const tarFilePath = path.join(npmPath, `${version}.tgz`);
                console.info(`Downloading tarball [${packageData.dist.tarball}] -> [${tarFilePath}]`);
                await downloadFile(packageData.dist.tarball, tarFilePath);
                // await verifyFile(tarFilePath, packageData.dist.shasum);
                await untarFile(tarFilePath, npmPath);
                await exec(`mv ${path.join(npmPath, 'package')}/* ${npmPath}`);

                await buildProject(gitPath);
                await tidyGitRepo(gitPath);

                await buildProject(npmPath);
                await tidyNpmRepo(npmPath);

                const diff = await compareDirs(npmPath, gitPath);

                const validDiffs = diff.filter(d => d.diff.length);
                if (validDiffs.length) {
                    console.error(`Diffs for [${packageName}]`, JSON.stringify(validDiffs, null, '\t'));
                    throw new Error(`Failed to automatically verify [${packageName}], see logs for diff`);
                }

            } catch (err) {
                console.error(`Error verifying [${packageName}]:`, err);
            } finally {
                console.info(`Clearing up [${packageName}]`);
                await deleteDir(dirPath);
            }
        }
    }
}

async function compareDirs(refDir: string, compareDir: string) {
    const refFilePaths = await getFilesRecursive(refDir);
    const relativeFilePaths = refFilePaths.map(fp => path.relative(refDir, fp));
    const compareFilePaths = relativeFilePaths.map(fp => path.join(compareDir, fp));

    return Promise.all(
        refFilePaths.map(async (refFp, index) => {
            const compareFp = compareFilePaths[index];

            let refFileContent;
            let compareFileContent;

            refFileContent = await readFile(refFp);
            try {
                compareFileContent = await readFile(compareFp);
            } catch (err) {
                console.error(`File present in NPM module that's not present in Git repo. Is the build command correct.`, err);
            }

            return {
                file: relativeFilePaths[index],
                diff: diff.diffTrimmedLines(refFileContent, compareFileContent, { newlineIsToken: true, ignoreCase: false }).filter(d => d.hasOwnProperty('added'))
            };
        })
    );
}

async function untarFile(filePath: string, targetPath: string) {
    await exec(`tar -zxvf ${filePath} -C ${targetPath}`);
}

async function tidyGitRepo(dirPath: string) {
    await exec(`rm -rf ${path.join(dirPath, '.git')}`);
    await exec(`rm -rf ${path.join(dirPath, 'node_modules')}`);
}

async function tidyNpmRepo(dirPath: string) {
    await exec(`rm -rf ${path.join(dirPath, 'package')}`);
    await exec(`rm -rf ${path.join(dirPath, 'node_modules')}`);
    await exec(`rm -rf ${path.join(dirPath, '*.tgz')}`);
}

function verifyFile(filePath: string, hash: string) {
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .on('error', reject)
            .pipe(
                crypto.createHash('sha1').setEncoding('hex')
            )
            .once('finish', function () {
                const computedHash = this.read()
                if (computedHash === hash) resolve();
                else reject(`Invalid hash, expected [${hash}] but got [${computedHash}]`);
            });
    });
}

function downloadFile(url: string, targetPath: string) {
    return new Promise(async (resolve, reject) => {
        const { data: stream } = await axios({
            url,
            responseType: 'stream',
        });
        const writeStream = fs.createWriteStream(targetPath);
        stream.pipe(writeStream);
        stream.on('error', (err: any) => {
            reject({ message: `Failed to download [${url}]`, error: err });
            stream.close();
        });
        stream.on('end', () => {
            resolve();
        });
    });
}

async function getTmpDir(prefix: string) {
    const id = uuid();
    const dirPath = path.join(__dirname, '../', 'tmp', prefix + '__' + id);
    await mkdir(dirPath);

    return dirPath;
}

function getJSON(url: string) {
    return axios.get(url).then(a => a.data);
}

function mkdir(path: string) {
    return new Promise((resolve, reject) => {
        fs.mkdir(path, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

async function cloneVersionToDir(remote: string, version: string, targetDir: string) {
    const tidyRemote = remote.replace('git+', '');
    await git().clone(tidyRemote, targetDir);
    const g = git(targetDir);
    await g.fetch();
    const { all: tags } = await g.tags();
    const tag = tags.find(t => t.includes(version));
    console.info(`Using tag [${tag}]`);
    if (!tag) throw new Error(`Couldn't find obvious tag for version [${version}]`);
    await g.checkout(`tags/${tag}`);
}

function exec(cmd: string) {
    return new Promise((resolve, reject) => {
        _exec(cmd, (err, stdout, stderr) => {
            if (err) reject({ message: `Failed to exec [${cmd}]`, error: err });
            else resolve(stdout + stderr);
        });
    });
}

async function buildProject(targetDir: string) {
    await exec(`cd ${targetDir} && (npm ci || npm i --no-save)`);
    await exec(`cd ${targetDir} && (npm run build || echo 1)`);
}

async function getFilesRecursive(dirPath: string): Promise<string[]> {
    const _files = await readdir(dirPath);
    let files: string[] = [];
    for (let file of _files) {
        const filePath = path.join(dirPath, file);
        const isDirectory = await isDir(filePath);
        if (isDirectory) {
            files = files.concat(await getFilesRecursive(filePath));
        } else {
            files.push(filePath);
        }
    }
    return files;
}

function isDir(path: string) {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, info) => {
            if (err) reject(err);
            else resolve(info.isDirectory());
        })
    });
}

function readdir(path: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        fs.readdir(path, (err, files) => {
            if (err) reject(err);
            else resolve(files);
        });
    });
}

function readFile(path: string, encoding = 'utf8'): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(path, encoding, (err, fileContent) => {
            if (err) reject(err);
            else resolve(fileContent);
        });
    });
}

function deleteDir(path: string) {
    return exec(`rm -rf ${path}`);
}