const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const bcrypt = require('bcryptjs');

async function main() {

    //Seed users
    user = await prisma.user.create({
        data: {
            email: 'fabio.olcese@gmail.com',
            password: await bcrypt.hash('sonsof11', 12),
            username: 'Bembos',
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
                label: 'Waiting to Sell'  
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

    //Rules types
    await prisma.constraintType.create({
        data: 
            {
                label: 'General Constraint'
            }  
    })

    await prisma.constraintType.create({
        data: 
            {
                label: 'Contract Code Constraint',
                contractCodeConstraints: {
                    create: {
                        label: 'Source Code Constraints',
                        desc: 'The user constraints regarding the source code of a token\'s contract'
                    }
                }
            }
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