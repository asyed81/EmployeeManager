const Sequelize = require('sequelize');

	var sequelize = new Sequelize('REMOVED', 'REMOVED', 'REMOVED', {
    host: 'REMOVED',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    }
});

var Employee = sequelize.define('Employee', {
    employeeNum:{
        type: Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement: true
    },
    firstName: Sequelize.STRING,
    
    lastName: Sequelize.STRING,
    
    email: Sequelize.STRING,
    
    SSN: Sequelize.STRING,

    addressStreet: Sequelize.STRING,
    
    addressCity: Sequelize.STRING,
    
    addressState: Sequelize.STRING,
    
    addressPostal: Sequelize.STRING,
    
    maritalStatus: Sequelize.STRING,
    
    isManager: Sequelize.BOOLEAN,
    
    employeeManagerNum: Sequelize.INTEGER,
    
    status: Sequelize.STRING,
    
    hireDate: Sequelize.STRING,
    
    department: Sequelize.INTEGER
    
});

var Department=sequelize.define('Department', {
departmentId:{
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true 
    },
departmentName: Sequelize.STRING

});

Department.hasMany(Employee,{foreignKey:'department'});

module.exports.initialize = function(){
    return new Promise((resolve, reject)=>{
        sequelize.sync().then(resolve());
        reject("unable to sync the database");
    })
}

    module.exports.getAllEmployees = function(){
        return new Promise((resolve,reject)=>{
            Employee.findAll().then(function(data){
                resolve(data);
            }).catch(()=>{
                reject();
            })
        })
    }

    module.exports.getManagers = function(){
        return new Promise((resolve, reject)=>{
            Employee.findAll({
                where:{
                    isManager: true
                }
            }).then(function(data){
            resolve(data);
        });
                reject('no results returned')
            });
        }

        module.exports.updateEmployee = function(employeeData){
            return new Promise((resolve, reject)=>{
                employeeData.isManager = (employeeData.isManager) ? true : false;
    
                for (const property in employeeData) {
                    if(`${employeeData[property]}` == "")
                    {
                        employeeData[property] = null;
                    }
                  } 

                  Employee.update(employeeData, {
                    where: { employeeNum: employeeData.employeeNum } 
                }).then(function () {
                    resolve()
                }).catch(()=>{
                    reject();
                })
                });
            }

    module.exports.getDepartments = function(){
        return new Promise((resolve, reject)=>{
            Department.findAll().then(function(data){
            resolve(data);
        }).catch(()=>{
            reject(); 
        })
            });
        }

        module.exports.getDepartmentById = function(num){
            return new Promise((resolve, reject)=>{
                Department.findOne({
                    where:{
                        departmentId: num
                    }
                }).then(function(data){
                resolve(data);
            }).catch(()=>{
                reject();   
            })
            
        });
        }

        module.exports.getEmployeesByStatus = function(status){
            return new Promise((resolve, reject)=>{
                Employee.findAll({
                    where:{
                        status: status
                    }
                }).then(function(data){
                resolve(data);
            }).catch(()=>{
                reject();
            })
            
        });
    }
        
                module.exports.getEmployeesByDepartment = function(dpmt){
                    return new Promise((resolve, reject)=>{
                        Employee.findAll({
                            where:{
                                department: dpmt
                            }
                        }).then(function(data){
                        resolve(data);
                    }).catch(()=>{
                        reject('no results returned');
                    })
                });
                } 


        module.exports.getEmployeesByManager = function(manager){
            return new Promise((resolve, reject)=>{
                Employee.findAll({
                    where:{
                        employeeManagerNum: manager
                    }
                }).then(function(data){
                resolve(data);
            }).catch(()=>{
                reject();
            })
        });
        } 

        module.exports.getEmployeeByNum = function(num){
            return new Promise((resolve, reject)=>{
                Employee.findOne({
                    where:{
                        employeeNum: num
                    }
                }).then(function(data){
                resolve(data);
            }).catch(()=>{
                reject();
            })
        });
        }

module.exports.addEmployee = function(employeeData){
    return new Promise((resolve, reject)=>{
        employeeData.isManager = (employeeData.isManager) ? true : false;
    
        for (const property in employeeData) {
            if(`${employeeData[property]}` == "")
            {
                employeeData[property] = null;
            }
          } 
            Employee.create(employeeData).then(function(){
        resolve();
    }).catch(()=>{
    reject();
    })
    });    
}

module.exports.addDepartment = function(departmentData){
    return new Promise((resolve, reject)=>{
        for (const property in departmentData) {
            if(`${departmentData[property]}` == "")
            {
                departmentData[property] = null;
            }
          } 
            Department.create({
                departmentName: departmentData.departmentName
                
            }).then(function(){
        resolve();
    });
    });    
}

module.exports.updateDepartment = function(departmentData){
    return new Promise((resolve, reject)=>{
        for (const property in departmentData) {
            if(`${departmentData[property]}` == "")
            {
                departmentData[property] = null;
            }
          } 

          Department.update(departmentData, {
            where: { departmentId: departmentData.departmentId } 
        }).then(function () {
            resolve();
        }).catch(()=>{
            reject();
        })
        });
    }

    module.exports.deleteDepartmentById = function(num){
        return new Promise((resolve, reject)=>{
            Department.destroy({
                where:{
                    departmentId: num
                }
            }).then(function(){
            resolve();
        }).catch(()=>{
            reject();    
        })
    });
    }

    module.exports.deleteEmployeeByNum = function(num){
        return new Promise((resolve, reject)=>{
            Employee.destroy({
                where: {employeeNum: num}
            }).then(()=>{
                resolve();
            }).catch(()=>{
                reject();
            })
        })
    }


    
