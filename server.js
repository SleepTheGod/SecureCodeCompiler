const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const app = express();

// Security headers to protect against some attacks
const helmet = require('helmet');
app.use(helmet());

// Body parser middleware to handle JSON data
app.use(bodyParser.json());

// Allow CORS for specific domain (NSA might require this)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
});

// Route to compile C code
app.post('/compile', (req, res) => {
    const { code } = req.body;

    // Sanitize input code to prevent malicious code injection (basic example)
    if (code.includes("system(") || code.includes("exec(")) {
        return res.status(400).json({ error: "Suspicious code detected!" });
    }

    // Write code to a temporary C file
    const filePath = path.join(__dirname, 'temp.c');
    fs.writeFileSync(filePath, code);

    // Compile the code
    exec(`gcc ${filePath} -o ${path.join(__dirname, 'temp')}`, (error, stdout, stderr) => {
        if (error) {
            return res.status(400).json({ error: stderr || "Compilation failed" });
        }

        // Run the compiled program
        exec(path.join(__dirname, 'temp'), (runError, runStdout, runStderr) => {
            if (runError) {
                return res.status(400).json({ error: runStderr || "Execution failed" });
            }

            // Return the output
            res.json({ output: runStdout });
        });
    });
});

// Start the server on port 80
const port = 80;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
