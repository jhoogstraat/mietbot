// 2 -> 2
// 2 1/2 -> 2,5
export function formatRoomCount(text: string): number {
    const splitted = text.split(" ")
    if (splitted.length == 1) {
        return Number(splitted)
    } else if (splitted.length == 2) {
        var number = Number(splitted[0])
        var partial = splitted[1].split("/")
        number += Number(partial[0]) / Number(partial[1])
        return number
    } else {
        throw "Invalid room count formatting"
    }
}

// 599,00 -> 599
// 1.250,99 -> 1250.99
export function formatNumber(text: string): number {
    return Number(text.match(/[0-9,]/g)!.join("").replace(",", "."))
}

// Erdgeschoss -> 0
// '12' -> 12
export function formatFloor(text: string): number {
    text = text.trim()
    if (text === 'Erdgeschoss') {
        return 0
    } else {
        return Number(text.match(/\d+/)![0])
    }
}