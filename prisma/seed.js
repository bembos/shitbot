const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const bcrypt = require('bcryptjs');

async function main() {

    //Seed users
    await prisma.user.create({
        data: {
            email: 'fabio.olcese@gmail.com',
            password: await bcrypt.hash('sonsof11', 12),
            username: 'Bembos',
        },
    })

    await prisma.user.create({
        data: {
            email: 'diego.cor.mik@gmail.com',
            password: await bcrypt.hash('zephiross', 12),
            username: 'Zephero',
        },
    })

    await prisma.user.create({
        data: {
            email: 'orlando.ol@hotmail.com',
            password: await bcrypt.hash('sonsof11', 12),
            username: 'lalo',
        },
    })

    await prisma.user.create({
        data: {
            email: 'papita@gmail.com',
            password: await bcrypt.hash('papita12345', 12),
            username: 'ppta',
        },
    })

    //Buy Order statuses
    await prisma.buyOrderStatus.createMany({
        data: [
            {
                label: 'Waiting to Buy'
            },
            {
                label: 'Waiting to Sell'
            },
            {
                label: 'Failed'  
            },
            {
                label: 'Completed'
            }
        ]
    })

    //Transaction statuses
    await prisma.transactionStatus.createMany({
        data: [
            {
                label: 'Bought'
            },
            {
                label: 'Completed'
            },
            {
                label: 'Timed out'
            },
            {
                label: 'Failed'
            }
        ]
    })

    //Blockchains
    await prisma.blockchain.create({
        data: {
            label: 'Binance Smart Chain',
            abbrevation: 'BSC',
            provider: 'wss://ancient-snowy-moon.bsc.quiknode.pro/e4de697d846d1f1a152117267e5aed98d8977b2b/',
            router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
            currency: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
            decimals: 18
        },
    })

    //Blockchains
    await prisma.blockchain.create({
        data: {
            label: 'Polygon',
            abbrevation: 'Polygon',
            provider: 'wss://restless-rough-violet.matic.quiknode.pro/b71277366a27542ca3abe6689f8690abfeee3adc/',
            router: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
            currency: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
            decimals: 18
        },
    })
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
        .finally(async () => {
        await prisma.$disconnect()
    })