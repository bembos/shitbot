const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

//Pancake swap manager
const PancakeSwapManager = require('../crypto/pancakeSwapManager/pancakeSwapManager')

/**
 * Creates a bot for a user
 * @param {User} user 
 */
exports.createBotForUser = (user) => {
    return prisma.bot.create({
        data : {
            enabled : false,
            initialAmount : 0.01,
            autoMultiplier : 2,
            slippage: 13,
            maxTransaction : 5,
            maxTime: 600,
            userId: user.id
        }
    })
}

/**
 * Updates a bot model
 * @param {Request params} req 
 * @param {Id of bot to update} botId 
 * @returns 
 */
exports.updateBot = (req, botId) => {
    return prisma.bot.update({
        where : {
            id: parseInt(botId)
        },
        data : {
            initialAmount : parseFloat(req.body.initialAmount),
            autoMultiplier : parseFloat(req.body.autoMultiplier),
            slippage : parseInt(req.body.slippage),
            maxTransaction : parseInt(req.body.maxTransaction),
            maxTime: parseInt(req.body.maxTime)
        }
    })
}

/**
 * Retrieves the user's bot
 * @param {User} user 
 * @returns 
 */
exports.retrieveUserWithBot = (user) => {
    return prisma.user.findUnique({
        where : {
            id: user.id
        },
        include: {
            bot: true
        }
    })
}

/**
 * Starts the passive bot functionality
 * @param {request} req 
 */
exports.start = async (req) => {

    let user = req.user;
    let passiveBotManager = PancakeSwapManager.getPassiveBotManager();

    //Retrieve user data
    user = await prisma.user.findUnique({
        where : {
            id: user.id
        },
        include: {
            bot: true,
            generalConstraints: true,
            contractCodeConstaints: true
        }
    })

    //Check if it has general constraints
    if (!user.generalConstraints) {
        req.flash('error_msg', 'Bot needs general configurations to be set'); 

        return
    } 

    //Start the instance
    passiveBotManager.start({
        bot : user.bot,
        user : user,
        generalConfCons: user.generalConstraints,
        contractCodeCons : user.contractCodeConstaints
    });

    //Set bot  to enabled
    await prisma.bot.update({
        where : {
            id: user.bot.id
        },
        data : {
            enabled : true,
        }
    })
}

/**
 * Stop the passive bot functionality
 * @param {request} req 
 */
exports.stop = async (req) => {

    let user = req.user;
    let passiveBotManager = PancakeSwapManager.getPassiveBotManager();

    //Retrieve user data
    user = await prisma.user.findUnique({
        where : {
            id: user.id
        },
        include: {
            bot: true
        }
    })

     //Update the bot
     await prisma.bot.update({
        where : {
            id: user.bot.id
        },
        data : {
            enabled : false,
        }
    })

    //Start the instance
    passiveBotManager.stop({
        bot : user.bot
    });

   
}