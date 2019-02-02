#!/usr/bin/env node

process.on('SIGTERM', ()=>console.log('ignored SIGTERM'))
process.on('SIGINT',  ()=>console.log('ignored SIGINT'))

const { execSync } = require('child_process')
const node = process.argv[0]
const which = command => execSync(`which ${command}`).toString().trim()
const commands = [ 'sync', 'cryptsetup', node ].map(which)

const ldd = executable => execSync(`ldd ${executable}`).toString().trim()
const parse = lines => lines.split('\n')
  .map(line=>line.trim())
  .map(line=>line.split(' => '))
  .map(line=>line[line.length - 1].split(' ')[0])
  .filter(library=>library!=='linux-vdso.so.1')
const merge = (all, libraries) => new Set([ ...all, ...libraries ])
const libraries = commands.map(ldd).map(parse).reduce(merge, [])

const ramdiskPath = '/tmp/suspend'
const files = [...commands, ...libraries]
console.log(`copying to ramdisk: ${files.join(' ')}`)
execSync(`mkdir -p -m 0600 ${ramdiskPath}`)
execSync(`umount --quiet ${ramdiskPath} || /bin/true`)
execSync(`mount -t tmpfs -o size=128M tmpfs ${ramdiskPath}`)
execSync(`cp ${__dirname}/suspend.js ${ramdiskPath}`)
for (let file of files)
  execSync(`cp --parents ${file} ${ramdiskPath}`)
//execSync(`ln -s ${ramdiskPath}/usr/bin/bash ${ramdiskPath}/bin/sh`)
const directories = ['/sys', '/proc', '/dev', '/run']
for (let directory of directories) {
  execSync(`mkdir -p -m 0600 ${ramdiskPath}${directory}`)
  execSync(`mount -o bind ${directory} ${ramdiskPath}${directory}`) }

execSync(`openvt -c 8 -sw -- chroot ${ramdiskPath} ${node} /suspend.js`)
execSync(`umount ${ramdiskPath}`)
