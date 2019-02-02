process.on('SIGTERM', () => console.log('ignored SIGTERM'))
process.on('SIGINT',  () => console.log('ignored SIGINT'))

const { spawnSync } = require('child_process')
const { writeFileSync } = require('fs')

// in the pre-suspend ramdisk:

spawnSync('sync')
console.log('Synced.')

const main = 'cr_ata-MTFDDAK256MAY-1AH12ABHA_14290CE84912-part2'
spawnSync('cryptsetup', [ 'luksSuspend', main ])
console.log('LUKS suspended.')

spawnSync('sync')
console.log('Synced.')

console.log('Writing "mem" in /sys/power/state')
writeFileSync('/sys/power/state', 'mem\n')

// system is now suspended.

// on wake up:

resume()
console.log('LUKS resumed.')

function resume () {
  try {
    const result = spawnSync('cryptsetup', [ 'luksResume', main ], { stdio: 'inherit' })
    console.log(result)
  } catch (e) {
    resume()
  }
}
