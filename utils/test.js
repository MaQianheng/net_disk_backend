const WebTorrent = require('webtorrent')

const client = new WebTorrent()
const magnetURI = 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent'

/*
* deselectedFileEstimateSize：webtorrent无法做到在下载之前选择下载哪些文件，只能获取到torrent后先取消选择所有文件，再选择需要下载的文件（此时下载已经开始，所以所有文件都会有流量通过，即一定会生成对应文件并下载部分内容，所以在计算总进度时要把额外的这部分也算进去，但只能是个估计值）
* */
const deselectedFileEstimateSize = 128


const cb = (torrent) => {
    let totalBytes = 0
    // Got torrent metadata!
    console.log('Client is downloading')
    // Remove default selection (whole torrent)
    torrent.deselect(0, torrent.pieces.length - 1, false)

    torrent.files.forEach((file) => {
        const fileExt = file.name.split('.').pop()
        if (fileExt === 'srt') {
            file.select()
            totalBytes += file.length
            console.log('we will download only srt files')
        } else totalBytes += Math.min(file.length, deselectedFileEstimateSize * 1024)
    })

    torrent.on('download', (bytes) => {
        console.log('just downloaded: ' + bytes)
        console.log('total downloaded: ' + prettyBytes(torrent.downloaded))
        console.log('download speed: ' + prettyBytes(torrent.downloadSpeed))
        console.log(torrent.downloaded, totalBytes)
        console.log('progress: ' + Math.round(torrent.downloaded / totalBytes))
    })

    torrent.on('noPeers', (announceType) => {
        console.log(announceType, 'no peers...')
    })

    torrent.on('done', () => {
        console.log('torrent finished downloading')
        client.remove(magnetURI, {}, (e) => {
            console.log(e)
        })
        torrent.files.forEach(({name, path, length}) => {
            console.log(name, path, prettyBytes(length))
        })
    })
}

client.add(magnetURI, {path: "downloads"}, cb)

// client.remove(magnetURI, {}, (e) => {
//     console.log(e)
// })

client.on('error', (err) => {
    console.log(err)
})
client.on('warning', (err) => {
    console.log(err)
})

function prettyBytes(num) {
    const units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const neg = num < 0
    if (neg) num = -num
    if (num < 1) return (neg ? '-' : '') + num + ' B'
    const exponent = Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1)
    const unit = units[exponent]
    num = Number((num / Math.pow(1000, exponent)).toFixed(2))
    return (neg ? '-' : '') + num + ' ' + unit
}
