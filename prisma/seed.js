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
    
    //Blockchains
    await prisma.blockchain.create({
        data: {
            label: 'Binance Smart Chain',
            abbrevation: 'BSC'
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
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
        .finally(async () => {
        await prisma.$disconnect()
    })