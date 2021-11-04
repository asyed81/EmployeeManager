var express = require("express");
const app = express();
const bodyParser = require("body-parser");
const exphbs = require("express-handlebars");
const clientSessions = require("client-sessions")
const dataServiceAuth = require("./data-service-auth.js");
const path = require('path');
const dataService = require('./data-service.js');
const multer = require("multer");
const fs = require("fs");
const Handlebars = require('handlebars');

app.use(clientSessions({
  cookieName: "session",
    secret: "REMOVED",
  duration: 2 * 60 * 1000,
  activeDuration: 1000 * 60
}));

const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access')

app.engine('hbs', exphbs({
  extname: ".hbs",
  handlebars: allowInsecurePrototypeAccess(Handlebars)
}));
app.set('view engine', 'hbs');

var HTTP_PORT = process.env.PORT || 8080;
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

app.use(function (req, res, next) {
  let route = req.baseUrl + req.path;
  app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
  next();
});

app.engine('.hbs', exphbs({
  extname: '.hbs',
  helpers: {
    navLink: function (url, options) {
      return '<li' +
        ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
        '><a href="' + url + '">' + options.fn(this) + '</a></li>';
    },
    equal: function (lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue != rvalue) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    }
  }
}));

app.get("/", function (req, res) {
  res.render('home');
});

app.get("/about", function (req, res) {
  res.render('about');
});

// Checks if user is authenticated
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

app.get("/employees/add", ensureLogin, (req, res) => {
  dataService.getDepartments().then((data) => {
    res.render("addEmployee", { departments: data.map(data => data.toJSON()) });
  }).catch(() => {
    res.render("addEmployee", { departments: [] });
  });
});

app.post("/employees/add", ensureLogin, (req, res) => {
  dataService.addEmployee(req.body).then(() => {
    res.redirect("/employees");
  }).catch(() => {
    res.render("employees", { message: "Failed to add" });
  })
});

app.post("/employee/update", ensureLogin, (req, res) => {
  dataService.updateEmployee(req.body).then(() => {
    res.redirect("/employees");
  });
});

//route to listen on /employees with optional queries
app.get("/employees", ensureLogin, (req, res) => {
  if (req.query.status) {
    dataService.getEmployeesByStatus(req.query.status).then((data) => {
      res.render("employees", { data: data.map(data => data.toJSON()) });
    }).catch((err) => {
      res.render("employees", { message: "no results" });
    });
  } else if (req.query.department) {
    dataService.getEmployeesByDepartment(req.query.department).then((data) => {
      res.render("employees", { data: data.map(data => data.toJSON()) });
    }).catch((err) => {
      res.render("employees", { message: "no results" });
    });
  } else if (req.query.manager) {
    dataService.getEmployeesByManager(req.query.manager).then((data) => {
      res.render("employees", { data: data.map(data => data.toJSON()) });
    }).catch((err) => {
      res.render("employees", { message: "no results" });
    });
  } else {
    dataService.getAllEmployees().then((data) => {
      res.render("employees", { data: data.map(data => data.toJSON()) });

    }).catch((err) => {
      res.render("employees", { message: "no results" });
    });
  }
});

//Listening for employee number query
app.get("/employee/:empNum", ensureLogin, (req, res) => {

  // initialize an empty object to store the values
  let viewData = {};

  dataService.getEmployeeByNum(req.params.empNum).then((data) => {
    if (data) {
      //store employee data in the "viewData" object as "employee"
      viewData.employee = data.dataValues; 
    } else {
      viewData.employee = null; 
    }
  }).catch(() => {
    // Set employee to null if there was an error 
    viewData.employee = null; 
  }).then(dataService.getDepartments)
    .then((data) => {
      // store department data in the "viewData" object as "departments"
      viewData.departments = data.map(value => value.dataValues); 

      // loop through viewData.departments and once we have found the departmentId that matches
      // the employee's "department" value, add a "selected" property to the matching 
      // viewData.departments object
      for (let i = 0; i < viewData.departments.length; i++) {
        if (viewData.departments[i].departmentId == viewData.employee.department) {
          viewData.departments[i].selected = true;
        }
      }
    }).catch(() => {
      viewData.departments = []; // set departments to empty if there was an error
    }).then(() => {
      if (viewData.employee == null) { // if no employee - return an error
        res.status(404).send("Employee Not Found");
      } else {
        res.render("employee", { viewData: viewData }); // render the "employee" view
      }
    });
});

//route to listen on /departments
app.get("/departments", ensureLogin, (req, res) => {

  dataService.getDepartments().then((data) => {
    res.render("departments", { departments: data.map(data => data.toJSON()) });
  }).catch((message => {
    res.render("departments", { departments: "No Departments" });
  }));
});

app.get("/images/add", ensureLogin, function (req, res) {

  res.render("addImage");
});

const storage = multer.diskStorage({
  destination: "./public/images/uploaded",
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

//override default and use diskStorage function for naming files
const upload = multer({ storage: storage });

app.get("/images", ensureLogin, (req, res) => {
  fs.readdir("./public/images/uploaded", function (err, items) {
    res.render("images", { items, layout: false });
  });
});

app.post("/images/add", ensureLogin, upload.single("imageFile"), (req, res) => {
  res.redirect("/images");
});

app.get("/departments/add", ensureLogin, function (req, res) {
  res.render('addDepartment');
});

app.post("/departments/add", ensureLogin, (req, res) => {
  dataService.addDepartment(req.body).then(() => {
    res.redirect("/departments");
  }).catch(function () {
    res.render("departments", { message: "Failed!" });
  })
});

app.post("/department/update", ensureLogin, (req, res) => {
  dataService.updateDepartment(req.body).then(() => {
    res.redirect("/departments");
  });
});

app.get("/department/:id", ensureLogin, (req, res) => {
  dataService.getDepartmentById(req.params.id).then((data) => {
    if (data == undefined) {
      res.status(404).send("Department Not Found");
      console.log("not f")
    }
    else {
      console.log("found");
      console.log("-----------------------------");
      console.log(data.toJSON());
      res.render("department", { department: data.toJSON() });
    }
  }).catch((err) => {
    res.render("department", { message: "no results" });
  });
});

app.get("/departments/delete/:num", ensureLogin, (req, res) => {

  dataService.deleteDepartmentById(req.params.num).then((data) => {
    res.redirect('/departments');
  }).catch((message => {
    res.status(500).send("Department Not Found");
  }));
});

app.get("/employees/delete/:num", ensureLogin, (req, res) => {
  dataService.deleteEmployeeByNum(req.params.num).then((data) => {
    res.redirect('/employees');
  }).catch((message => {
    res.status(500).send("Employee Not Found");
  }));
});

app.get("/login", function (req, res) {
  res.render('login');
});

app.post("/login", function (req, res) {
  req.body.userAgent = req.get('User-Agent');
  dataServiceAuth.checkUser(req.body).then((usr) => {
    console.log("--------------------" + req);
    req.session.user = {
      userName: usr.userName,
      email: usr.email,   // authenticated user's email
      loginHistory: usr.loginHistory// authenticated user's loginHistory
    }
    console.log("--------------------");
    res.redirect('/employees');
  }).catch((err) => {
    console.log("rendering error");
    res.render("login", { errorMessage: err, userName: req.body.userName });
  })
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  console.log("=======================================")
  dataServiceAuth.registerUser(req.body).then(() => {
    res.render("register", { successMessage: "User created" })
  }).catch((err) => {
    res.render("register", { errorMessage: err, userName: req.body.userName })
  })
});

app.get("/logout", function (req, res) {
  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", ensureLogin, function (req, res) {

  res.render("userHistory")
});

//404 error (when requested path doesn't exist)
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "/views/404.html"));
});

//initialize and start server
dataService.initialize()
  .then(dataServiceAuth.initialize)
  .then(function () {
    app.listen(HTTP_PORT, function () {
      console.log("app listening on: " + HTTP_PORT)
    });
  }).catch(function (err) {
    console.log("unable to start server: " + err);
  });
