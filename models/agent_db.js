const {response} = require("express");
const mysql = require("mysql");
const random = require("random");
const db = require("./database.js");

class agent_db {
  constructor() {
    global.db = db;
  }

  //GET ALL AGENTS------------------------------------------------------------------------
  get_all(callback) {
    let query = "SELECT * FROM agent";
    try {
      db.query(query, (error, response) => {
        if (error) {
          return callback({status: false, message: "System error"});
        }
        return callback({
          status: true,
          message: "All agents",
          data: response,
        });
      });
    } catch (error) {
      return callback({
        status: false,
        message: "Critical error",
      });
    }
  }

  
  // LOGIN SECTION ---------------------------------------------------------------------------
  get_user(email, callback) {
    let query = "SELECT * FROM agent WHERE email=?";

    if (email) {
      try {
        db.query(query,[email], (err, response) => {
          if (err) {
            return callback({ status: false, message: "error here" });
          }
          if (response.length == 0) {
            return callback({
              status: false,
              message: "response is null",
            });
          } else {
            console.log("user response", response[0]);
            return callback({
              status: true,
              message: "Email is found",
              response: response[0],
            });
          }
        });
      } catch (err) {
        return callback({
          status: false,
          message: "failed user login (email not in database)",
        });
      }
    } else {
      return callback({
        status: false,
        msg: "failed user login",
      });
    }
  }

  //GET SINGLE AGENT USING agent_id------------------------------------------------------------------------
  get_one(agent_id, callback) {
    // if (agent_id.isNAN) {
    //   return callback({
    //     status: false,
    //     message: "agent_id should be an integer",
    //   });
    // }
    let query = 'SELECT * FROM agent WHERE id="?"';
    try {
      db.query(query, [agent_id], (error, response) => {
        if (error) {
          throw error;
          return callback({status: false, message: "System error"});
        }
        return callback({
          status: true,
          message: "Single agents",
          data: response,
        });
      });
    } catch (error) {
      return callback({
        status: false,
        message: "Critical error",
      });
    }
  }

  //Get single agent from agent db using wallet_number------------------------------------------------------------------------
  get_wn(wallet_number, callback) {
    let query = 'SELECT * FROM agent WHERE wallet_number="?"';
    if (!wallet_number.isNAN) {
      //Check if wallet number is an integer
      return callback({
        status: false,
        message: "wallet_number should be an integer",
      });
    }
    try {
      db.query(query, [wallet_number], (error, response) => {
        if (error) {
          // throw error;
          return callback({
            status: false,
            message: "System error",
          });
        }
        return callback({
          status: true,
          message: "Single agent using wallet number",
          data: response,
        });
      });
    } catch (error) {
      return callback({
        status: false,
        message: "Critical error",
      });
    }
  }

  //Agent top up wallet------------------------------------------------------------------------
  top_up(amount, wallet_number, callback) {
    let query = "UPDATE agent SET wallet= ? WHERE wallet_number=?";

    try {
      this.get_wallet(wallet_number, (response) => {
        if (response.status == true) {
          var current_wallet = response.response; // get agent current wallet amount
          console.log("current wallet", parseFloat(current_wallet));
          var new_wallet = current_wallet + amount; // calculate new wallet amount

          db.query(query, [new_wallet, wallet_number], (error, response) => {
            //updates agent wallet with top_up amount
            if (error) {
              // throw error;
              return callback({
                status: false,
                message: "System error",
              });
            }
            //TODO: PERFOM DEPOSITE ON DESIRED PAYMENT PLATFORM API

            //add transaction
            this.add_transaction(
              wallet_number,
              amount,
              "completed",
              "credit",
              null,
              (response) => {
                if (response.status == true) {
                  return callback({
                    status: true,
                    message: "top up added successfully",
                    data: new_wallet,
                  });
                } else {
                  return callback({
                    status: false,
                    message: response.message,
                  });
                }
              }
            );
          });
        } else {
          return callback({
            status: false,
            message: "Error getting current wallet",
          });
        }
      });
    } catch (error) {
      return callback({
        status: false,
        message: "Critical error",
      });
    }
  }

  //get agent current wallet amount
  get_wallet(wallet_number, callback) {
    let query = "SELECT wallet FROM agent WHERE wallet_number=?";
    try {
      db.query(query, [wallet_number], (error, response) => {
        if (error) {
          callback({
            status: false,
            message: "system error",
          });
        }
        console.log("get wallet :>> ", parseFloat(response[0]["wallet"]));
        return callback({
          status: true,
          response: parseFloat(response[0]["wallet"]),
        });
      });
    } catch (error) {
      console.log("error", error);
      return callback({
        status: false,
        message: "Critical error",
      });
    }
  }

  //create transaction------------------------------------------------------------------------
  add_transaction(
    wallet_number,
    amount,
    status,
    transaction_type,
    end_date,
    callback
  ) {
    let query =
      "INSERT INTO transactions (`transaction_id`, `wallet_number`, `amount`, `status`, `transaction_type`, `time`, `start_date`, `end_date`) VALUES (?)";

    var transaction_id = random.int(10000, 100000);
    // var transaction_id = 4430274
    // date and time
    const oldDate = new Date();
    var start_date = oldDate.toISOString().split("T")[0];
    var time = new Date().toLocaleTimeString();
    if (transaction_type != "loan_deposit") {
      end_date = start_date;
    }
    var values = [
      transaction_id,
      wallet_number,
      amount,
      status,
      transaction_type,
      time,
      start_date,
      end_date,
    ];
    try {
      db.query(query, [values], (error, response) => {
        if (error) {
          // throw error;
          return callback({
            status: false,
            message: "system error",
          });
        }
        return callback({
          status: true,
          message: "new transaction added",
          response: response,
        });
      });
    } catch (error) {
      console.log("error", error);
      return callback({
        status: false,
        message: "Critical error",
      });
    }
  }

  //Agent withdraw from wallet------------------------------------------------------------------------
  withdraw(wallet_number, amount, callback) {
    let query = "UPDATE agent SET wallet= ? WHERE wallet_number=?";

    try {
      this.get_wallet(wallet_number, (response) => {
        if (response.status == true) {
          var current_wallet = response.response; // get agent current wallet amount
          console.log("current wallet", parseFloat(current_wallet));
          var new_wallet = current_wallet - amount; // calculate new wallet amount

          db.query(query, [new_wallet, wallet_number], (error, response) => {
            //updates agent wallet with new amount
            if (error) {
              // throw error;
              return callback({
                status: false,
                message: "System error",
              });
            }
            //TODO: PERFOM WITHDRAWAL ON DESIRED PAYMENT PLATFORM API

            //add transaction
            this.add_transaction(
              wallet_number,
              amount,
              "completed",
              "debit",
              null,
              (response) => {
                if (response.status == true) {
                  return callback({
                    status: true,
                    message: "Withdrawal successfully",
                    data: new_wallet,
                  });
                } else {
                  return callback({
                    status: false,
                    message: response.message,
                  });
                }
              }
            );
          });
        } else {
          return callback({
            status: false,
            message: "Error getting current wallet",
          });
        }
      });
    } catch (error) {
      return callback({
        status: false,
        message: "Critical error",
      });
    }
  }

  //Agent request loans------------------------------------------------------------------------
  request_loan(wallet_number, amount, callback) {
    let query = "UPDATE agent SET wallet= ? WHERE wallet_number=?";

    try {
      this.loan_checker(wallet_number, (response) => {
        if (response.status == true && response.response <= 0) {
          this.get_wallet(wallet_number, (response) => {
            if (response.status == true) {
              var current_wallet = response.response; // get agent current wallet amount
              console.log("current wallet", parseFloat(current_wallet));
              var new_wallet = current_wallet + amount; // calculate new wallet amount
              db.query(
                query,
                [new_wallet, wallet_number],
                (error, response) => {
                  //updates agent wallet with new amount
                  if (error) {
                    // throw error;
                    return callback({
                      status: false,
                      message: "System error",
                    });
                  }
                  this.update_loan(wallet_number, amount, (response) => {
                    // update loan_amount agent owes currently
                    if (response.status == true) {
                      //add transaction
                      this.add_transaction(
                        wallet_number,
                        amount,
                        "completed",
                        "loan_deposit",
                        null,
                        (response) => {
                          if (response.status == true) {
                            return callback({
                              status: true,
                              message: "Withdrawal successfully",
                              data: new_wallet,
                            });
                          } else {
                            return callback({
                              status: false,
                              message: response.message,
                            });
                          }
                        }
                      );
                    } else {
                      return callback({
                        status: false,
                        message: "Error updating agent loan amount",
                      });
                    }
                  });
                }
              );
            } else {
              return callback({
                status: false,
                message: "Error getting current wallet",
              });
            }
          });
        } else {
          return callback({
            status: false,
            message: "Pay previous loan to qualify for a new one.",
          });
        }
      });
    } catch (error) {
      return callback({
        status: false,
        message: "Critical error",
      });
    }
  }

  //check if agent already borrowed previously
  loan_checker(wallet_number, callback) {
    let query = "SELECT loan_amount FROM agent WHERE wallet_number=?";
    try {
      db.query(query, wallet_number, (error, response) => {
        if (error) {
          // throw error;
          return callback({
            status: false,
            message: "System error",
          });
        }
        return callback({
          status: true,
          message: "Current loan amount",
          response: response[0]["loan_amount"],
        });
      });
    } catch (error) {
      return callback({
        status: false,
        message: "Critical error",
      });
    }
  }

  //update agent loan amount 
  update_loan(wallet_number, amount, callback) {
    let query = "UPDATE agent SET loan_amount= ? WHERE wallet_number=?";
    try {
      db.query(query, [amount, wallet_number], (error, response) => {
        if (error) {
          // throw error;
          return callback({
            status: false,
            message: "System error",
          });
        }
        return callback({
          status: true,
          message: "agent loan amount updated",
        });
      });
    } catch (error) {
      return callback({
        status: false,
        message: "Critical error",
      });
    }
  }

  //Agent repay loans from wallet------------------------------------------------------------------------
  repay_loan(wallet_number, amount, callback) {
    let query = "UPDATE agent SET wallet= ? WHERE wallet_number=?";

    try {
      this.loan_checker(wallet_number, (loan_amt) => {
        if (loan_amt.status == true && loan_amt.response > 0) {
          this.get_wallet(wallet_number, (response) => {
            if (response.status == true) {
              var current_wallet = response.response; // get agent current wallet amount
              console.log("current wallet", parseFloat(current_wallet));
              var new_wallet = current_wallet - amount; // deduct loan from wallet amount
              db.query(
                query,
                [new_wallet, wallet_number],
                (error, response) => {
                  //updates agent wallet with new amount
                  if (error) {
                    // throw error;
                    return callback({
                      status: false,
                      message: "System error",
                    });
                  }
                  //get current loan amount
                  var loan_amount = loan_amt.response;
                  var new_loan_amount = loan_amount - amount;
                  this.update_loan(
                    wallet_number,
                    new_loan_amount,
                    (response) => {
                      // update loan_amount agent owes currently
                      if (response.status == true) {
                        //add transaction
                        this.add_transaction(
                          wallet_number,
                          amount,
                          "completed",
                          "loan_repayment",
                          null,
                          (response) => {
                            if (response.status == true) {
                              return callback({
                                status: true,
                                message: "Withdrawal successfully",
                                data: new_wallet,
                              });
                            } else {
                              return callback({
                                status: false,
                                message: response.message,
                              });
                            }
                          }
                        );
                      } else {
                        return callback({
                          status: false,
                          message: "Error updating agent loan amount",
                        });
                      }
                    }
                  );
                }
              );
            } else {
              return callback({
                status: false,
                message: "Error getting current wallet",
              });
            }
          });
        } else {
          return callback({
            status: false,
            message: "Congrats, You don't owe any loan",
          });
        }
      });
    } catch (error) {
      return callback({
        status: false,
        message: "Critical error",
      });
    }
  }


  //Transaction ---------------------------------------------------------------------
  get_transactions(wallet_number, start_date, end_date, transaction_type, callback){

    let query
    let values
    //start_date, end_date and transaction_type have values for filtering
    if(start_date && end_date && transaction_type){
      query = 'SELECT * FROM transactions WHERE wallet_number=? AND transaction_type=? AND start_date=? AND end_date=?'
      values = [wallet_number, transaction_type, start_date, end_date]
      console.log('all true')
      // callback({response:'all'})
    }
    //start_date and end_date only
    else if(start_date && end_date && !transaction_type){
      query = 'SELECT * FROM transactions WHERE wallet_number=? AND start_date=? AND end_date=?'
      values = [wallet_number, start_date, end_date]
      console.log('all true except transaction_type')
      // callback({response:'all except transaction'})
    }
    //start_date and transaction_type only
    else if(start_date && !end_date  && transaction_type){
      query = 'SELECT * FROM transactions WHERE wallet_number=? AND transaction_type=? AND start_date=?'
      values = [wallet_number, transaction_type, start_date]
      console.log('except end date')
      // callback({response:'except end date'})
    }
    //end_date and transaction_type only
    else if(!start_date && end_date && transaction_type){
      query = 'SELECT * FROM transactions WHERE wallet_number=? AND transaction_type=? AND end_date=?'
      values = [wallet_number, transaction_type, end_date]
      console.log('except start date')
      // callback({response:'except start date'})
    }
    //transaction_type only
    else if(transaction_type){
      query = 'SELECT * FROM transactions WHERE wallet_number=? AND transaction_type=?'
      values = [wallet_number, transaction_type]
      console.log('only transaction type')
      // callback({response:'only transaction'})
    }
    // general transaction 
    else{
      query = 'SELECT * FROM transactions WHERE wallet_number=?'
      values = [wallet_number]
      console.log('none')
      // callback({response:'none'})
    }

    try {
      db.query(query, values, (error, response)=>{
        if (error) {
          // throw error;
          return callback({
            status: false,
            message: "System error",
          });
        }
        console.log('response :>> ', response);
        return callback({
          status: true,
          message: 'Transaction request successful',
          response: response
        })
      })
      
    } catch (error) {
      return callback({
        status: false,
        message: "Critical error",
      });
    }
  }
}

module.exports = agent_db;
