

// const name = "Umesh";
// let age =21;
// const isStudent = true;
// let city;

// console.log(name)
// console.log(age)
// console.log(isStudent)
// console.log(city)
// console.log(typeof name)
// console.log(typeof age.toString())
// console.log(typeof isStudent )
// console.log(typeof city)


// const marks = 77

// if(marks >= 90){
//     console.log("Grade A")
// }
// else if (marks >= 75){
//     console.log(`Grade is B for ${marks}`)
// }
// else if (marks >= 35){
//     console.log(`Grade is C`)
// }
// else {
//     console.log("Failed")
// }

// const and let both are blocked scope. but const can not be re assign the value while let do. 

// for (let num =1; num <= 10; num++ ){
//     console.log(num)
// }

// let sum = 0; 

// for (let number =1; number <= 10; number++){
//     sum+=number
// }

// console.log("sum:",sum)


// function calculateDiscount(price,discount){
//     return price-(price*discount)/1000;
// }

// const discountedPrice = calculateDiscount(7200,10)
// console.log(discountedPrice)

// // arrow functions

// const add = (a,b) =>{return a+b}
// const square = number => number*number;

// console.log(add(2,3))
// console.log(square(5))


// const number = [10,20,30,40]
// console.log(number)

// const doubled = number.map( (number)=>{ return number*2})
// console.log(doubled);

// const greaterThen20 = number.filter((number)=>{return number > 20 })
// console.log(greaterThen20)

// const total = number.reduce((sum,number)=> sum+number,0)

// console.log(doubled)
// console.log(greaterThen20)
// console.log(total)

// const user={
//     name:"Aman",
//     age:31,
//     isActive: true
// }

// console.log(user)
// console.log(user.name)
// console.log(user["age"]);

// user.city = "Delhi"; 
// console.log(user);


// const message = "JavaScript is fun  ";

// console.log(message.trim());
// console.log(message.length);
// console.log(message.toLowerCase());
// console.log(message.includes("fun"));
// console.log(message.replace("fun","powerful"));



// const person = {
//     name: "Riya",
//     age:22,
//     city:"Mumbai"
// };


// const {name, city} = person

// console.log(name, city);

// const skills = ["JavaScript", "HTML"];
// const updatedSkills = [...skills, "CSS",...skills];

// console.log(updatedSkills);


// class Expense {
//     constructor(name,amount,paidBy){
//         this.name = name
//         this.amount = amount
//         this.paidBy= paidBy
//     }

//     getDetails() {
           
//         return `${this.name}:  ${this.amount}, paid by ${this.paidBy} `        
//     }

// }

// const expense = new Expense("Dinner",1000,"Umesh")
// console.log(expense.getDetails());



// class ApiResponce {
  

//     constructor(statuscode,data,message="something went wrong"){
//         this.statuscode=statuscode
//         this.data= data
//         this.message=message
//         this.result= statuscode<400
//     }

// }

// const firstAPI = new ApiResponce(500,"passing user data");

// console.log(firstAPI);
// // console.log(SecoundAPI);


// function createCounter(){

//     let count = 0; 

//     return function abcd () {
//         count++;
//         return count; 
//     };
// }

// const counter = createCounter();

// console.log(counter);
// console.log(counter())
// console.log(counter());
// console.log(counter());



// callback function 

const callback = (X) => {console.log("Hi this is the callback function")}

function processNumber(number,callback){
   return callback(number);
}

console.log(processNumber)
processNumber(5,callback)






