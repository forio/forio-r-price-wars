## Generate data
## Fit data
myseed <- 42

# When equal to 1, the model chooses decisions for player 2
active.players <- 1

# First product market is the biggest, and decreases in size
market.size <- c(10000, 5000, 1000)

# Five round game
total.rounds <- 5
current.round <- 0

# Default prices for each player, if no price is input
default.prices <- c(100, 400, 800)

# Costs to each player for each product. Increases as the size
# of the market decreases.
#
# Note that the game is not symmetric, and player 2 has an advantage in
# the most expensive, though smallest, product market, and player 1 has an 
# advantage in the two smaller product markets.
p1.costs <- c(60, 300, 600)
p2.costs <- c(70, 350, 400)


initialize <- function() {
    ## Use forio_random_seed if it is available (if being used on Epicenter)
    if (exists("forio_random_seed")) {
        set.seed(forio_random_seed)
    }
    else {
        set.seed(myseed)
    }
    current.round <<- 1
    
    rounds <<- seq(1, total.rounds)
    
    # Decision variable, stores the price decision for the current round
    # Can be a single number, as here, or a vector like "c(90, 350, 900)"
    p1.current.prices <<- 80
    p2.current.prices <<- 80
    
    # Each model is fit with a logistic regression.
    # Determines how much market share goes to each player.
    # The function create.model is defined later in this file.
    product1.model <<- create.model(0.5, 0.01, 1)
    product2.model <<- create.model(0.85, 0.01, 2)
    product3.model <<- create.model(0.6, 0.01, 3)
    
    # Historic prices that were chosen by each player
    p1.prices <<- matrix(0, nrow=3, ncol=total.rounds)
    p2.prices <<- matrix(0, nrow=3, ncol=total.rounds)
    
    # Market share for each player, broken down by product and round (proportion)
    p1.share <<- matrix(0, nrow=3, ncol=total.rounds)
    p2.share <<- matrix(0, nrow=3, ncol=total.rounds)
    
    # Number of units sold by each player, broken down by product and round
    p1.units <<- matrix(0, nrow=3, ncol=total.rounds)
    p2.units <<- matrix(0, nrow=3, ncol=total.rounds)
    
    # Revenue, broken down by product and round
    p1.revenue <<- matrix(0, nrow=3, ncol=total.rounds)
    p2.revenue <<- matrix(0, nrow=3, ncol=total.rounds)
    
    # Profit, broken down by product and round
    # For each product/round, is equal to revenue - units sold * cost per unit
    p1.profit <<- matrix(0, nrow=3, ncol=total.rounds)
    p2.profit <<- matrix(0, nrow=3, ncol=total.rounds)
    
    # Profit for each round aggregated by 
    p1.overall.profit <<- c(rep(0, total.rounds))
    p2.overall.profit <<- c(rep(0, total.rounds))
    
    # Cumulative profit reached by each product in each round. 
    # p1.cumulative.profit[1,3] is the cumulative profit reached for 
    # product 1 after round 3.
    p1.cumulative.profit <<- matrix(0, nrow=3, ncol=total.rounds)
    p2.cumulative.profit <<- matrix(0, nrow=3, ncol=total.rounds)
    
    # Cumulative profit reached by each player in each round.
    p1.cumulative.overall.profit <<- c(rep(0, total.rounds))
    p2.cumulative.overall.profit <<- c(rep(0, total.rounds))
    
    return("success")
}

# Internal function creates the the logistic regression models based on 
# simulated data. 
create.model <- function(mean, scale, index) {
    # Create random data for the model.
    x <- rnorm(market.size[index])
    z <- mean + scale*x
    pr <- 1/(1 + exp(-z))
    y1 <- as.integer(pr*market.size[index])
    y2 <- market.size[index] - y1
    df <- data.frame(y1=y1, y2=y2, x=x)
    
    # Create the model.
    # Model predicts proportions of product market that goes to each
    # player, thus cbind(y1, y2) is the response variable.
    model <- glm(cbind(y1, y2) ~ x, data=df, family=binomial('logit'))
    return(model)
}

# Advance the game to the next round. Does not work past round 6 (which is 
# actually the end of the game)
advanceRound <- function() {
    if (current.round > total.rounds) {
        return("Reached end. Not advancing")
    }
    
    # First check to see if nothing has been set. If not, then use the default
    # prices for each product
    if (is.null(p1.current.prices)) {
        p1.prices[,current.round] <<- default.prices
    }
    else {
        p1.prices[,current.round] <<- p1.current.prices   
    }
    if (active.players == 1) {
        if (is.null(p2.current.prices) && current.round == 1) {
            p2.prices[,current.round] <<- default.prices
        }
    }
    else {
        if (is.null(p2.current.prices)) {
            p2.prices[,current.round] <<- default.prices
        }
        else {
            p2.prices[,current.round] <<- p2.current.prices   
        }
    }    
    
    # Calculate the differences in prices
    differences <- p2.prices[,current.round] - p1.prices[,current.round]
    calculateFinancials(differences)
    
    current.round <<- current.round + 1
    
    p1.current.prices <<- 80
    p2.current.prices <<- 80
    
    if (active.players == 1 && current.round < total.rounds + 1) {
        adjustP2Prices(differences)
    }
    return("advanced")
}

# Determine the financial information for the round based on the market shares
calculateFinancials <- function(differences) {
    # Calculate the share of each market for player 1. 
    # type='response' ensures that the return value is scaled according to the response variable
    p1.share[1,current.round] <<- predict.glm(product1.model, data.frame(x=differences[1]), type='response')
    p1.share[2,current.round] <<- predict.glm(product2.model, data.frame(x=differences[2]), type='response')
    p1.share[3,current.round] <<- predict.glm(product3.model, data.frame(x=differences[3]), type='response')
    
    # Calculate the share of each market for player 2
    p2.share[,current.round] <<- 1.0 - p1.share[,current.round]
    
    # Calculate the number of units sold to each market
    p1.units[,current.round] <<- as.integer(p1.share[,current.round] * market.size)
    p2.units[,current.round] <<- market.size - p1.units[,current.round]
    
    p1.revenue[,current.round] <<- p1.units[,current.round] * p1.prices[,current.round]
    p2.revenue[,current.round] <<- p2.units[,current.round] * p2.prices[,current.round]
    
    p1.profit[,current.round] <<- p1.revenue[,current.round] - p1.units[,current.round] * p1.costs
    p2.profit[,current.round] <<- p2.revenue[,current.round] - p2.units[,current.round] * p2.costs
    
    p1.overall.profit[current.round] <<- sum(p1.profit[,current.round])
    p2.overall.profit[current.round] <<- sum(p2.profit[,current.round])
    
    p1.cumulative.profit[,current.round] <<- rowSums(p1.profit)
    p2.cumulative.profit[,current.round] <<- rowSums(p2.profit)
    
    p1.cumulative.overall.profit[current.round] <<- sum(p1.cumulative.profit[,current.round])
    p2.cumulative.overall.profit[current.round] <<- sum(p2.cumulative.profit[,current.round])
}

# Adjusts the P2 prices according to what player 1 prices were.
# P2 Refuses to lose money, and refuses to markup more than 3 times the cost
adjustP2Prices <- function(differences) {
    # Move 20% to minimize differences
    p2.prices[,current.round] <<- p2.prices[,current.round - 1] - 0.20 * differences
    p2.prices[,current.round][p2.prices[,current.round] < p2.costs] <<- p2.costs[p2.prices[,current.round] < p2.costs]
    p2.prices[,current.round][p2.prices[,current.round] > 3*p2.costs] <<- 3*p2.costs[p2.prices[,current.round] > 3*p2.costs]   
}


initialize()