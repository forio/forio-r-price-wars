## Generate data
## Fit data
myseed <- 42

active.players <- 1

market.size <- c(10000, 5000, 1000)
total.rounds <- 5
current.round <- 0

default.prices <- c(100, 400, 800)
p1.costs <- c(60, 300, 600)
p2.costs <- c(70, 350, 400)

p1.current.prices <- NA
p2.current.prices <- NA

product1.model <- NULL
product2.model <- NULL
product3.model <- NULL

p1.prices <- matrix(0, nrow=3, ncol=total.rounds)
p2.prices <- matrix(0, nrow=3, ncol=total.rounds)

p1.share <- matrix(0, nrow=3, ncol=total.rounds)
p2.share <- matrix(0, nrow=3, ncol=total.rounds)

p1.units <- matrix(0, nrow=3, ncol=total.rounds)
p2.units <- matrix(0, nrow=3, ncol=total.rounds)

p1.revenue <- matrix(0, nrow=3, ncol=total.rounds)
p2.revenue <- matrix(0, nrow=3, ncol=total.rounds)

p1.profit <- matrix(0, nrow=3, ncol=total.rounds)
p2.profit <- matrix(0, nrow=3, ncol=total.rounds)

p1.overall.profit <- c(rep(0, total.rounds))
p2.overall.profit <- c(rep(0, total.rounds))

p1.cumulative.profit <- matrix(0, nrow=3, ncol=total.rounds)
p2.cumulative.profit <- matrix(0, nrow=3, ncol=total.rounds)

p1.cumulative.overall.profit <- c(rep(0, total.rounds))
p2.cumulative.overall.profit <- c(rep(0, total.rounds))

initialize <- function() {
    ## Use forio_random_seed if it is available
    if (exists("forio_random_seed")) {
        set.seed(forio_random_seed)
    }
    else {
        set.seed(myseed)
    }
    current.round <<- 1
  
    rounds <<- seq(1, total.rounds)
    
    p1.current.prices <<- NULL
    p2.current.prices <<- NULL
    
    product1.model <<- create.model(0.5, 0.01, 1)
    product2.model <<- create.model(0.85, 0.01, 2)
    product3.model <<- create.model(0.6, 0.01, 3)
    
    p1.prices <<- matrix(0, nrow=3, ncol=total.rounds)
    p2.prices <<- matrix(0, nrow=3, ncol=total.rounds)
    
    p1.share <<- matrix(0, nrow=3, ncol=total.rounds)
    p2.share <<- matrix(0, nrow=3, ncol=total.rounds)
    
    p1.units <<- matrix(0, nrow=3, ncol=total.rounds)
    p2.units <<- matrix(0, nrow=3, ncol=total.rounds)
    
    p1.revenue <<- matrix(0, nrow=3, ncol=total.rounds)
    p2.revenue <<- matrix(0, nrow=3, ncol=total.rounds)
    
    p1.profit <<- matrix(0, nrow=3, ncol=total.rounds)
    p2.profit <<- matrix(0, nrow=3, ncol=total.rounds)
    
    p1.overall.profit <<- c(rep(0, total.rounds))
    p2.overall.profit <<- c(rep(0, total.rounds))
    
    p1.cumulative.profit <<- matrix(0, nrow=3, ncol=total.rounds)
    p2.cumulative.profit <<- matrix(0, nrow=3, ncol=total.rounds)
    
    p1.cumulative.overall.profit <<- c(rep(0, total.rounds))
    p2.cumulative.overall.profit <<- c(rep(0, total.rounds))
    
    return("success")
}

create.model <- function(mean, scale, index) {
    ## Create random data for the model
    x <- rnorm(market.size[index])
    z <- mean + scale*x
    pr <- 1/(1 + exp(-z))
    y1 <- as.integer(pr*market.size[index])
    y2 <- market.size[index] - y1
    df <- data.frame(y1=y1, y2=y2, x=x)
  
    # Create the model
    model <- glm(cbind(y1, y2) ~ x, data=df, family=binomial('logit'))
    model
}

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
        else if (!is.null(p2.current.prices) && current.round == 1) {
            p2.prices[,current.round] <<- p2.current.prices
        }
        else if (!is.null(p2.current.prices)) {
            p2.prices[,current.round] <<- p2.current.prices
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
    
    differences <- p2.prices[,current.round] - p1.prices[,current.round]
    calculateFinancials(differences)
    
    current.round <<- current.round + 1
    
    p1.current.prices <<- NULL
    p2.current.prices <<- NULL
    
    if (active.players == 1 && current.round < total.rounds + 1) {
        adjustP2Prices(differences)
    }
    return("advanced")
}

calculateFinancials <- function(differences) {
    # Calculate the share of each market for player 1
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
# Refuses to lose money, and refuses to markup more than 3 times the cost
adjustP2Prices <- function(differences) {
    # Move 20% to minimize differences
    p2.prices[,current.round] <<- p2.prices[,current.round - 1] - 0.20 * differences
    p2.prices[,current.round][p2.prices[,current.round] < p2.costs] <<- p2.costs[p2.prices[,current.round] < p2.costs]
    p2.prices[,current.round][p2.prices[,current.round] > 3*p2.costs] <<- 3*p2.costs[p2.prices[,current.round] > 3*p2.costs]   
}


initialize()