# Devied Co. E-commerce Application

## Running the Server

### Windows PowerShell Issue
If you encounter this error when running `npm run dev`:
```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system.
```

You have a few options to fix this:

#### Option 1: Run with execution policy bypass (recommended for development)
```powershell
powershell -ExecutionPolicy Bypass -Command "npm run dev"
```

#### Option 2: Change execution policy temporarily for current session
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
Then run `npm run dev`

#### Option 3: Use Command Prompt instead
Open cmd.exe and navigate to your project directory:
```cmd
cd C:\Users\lenovo\Desktop\dev\deviedco
npm run dev
```

## Development Notes

### PowerShell Commands
For running commands in PowerShell, note that `&&` doesn't work as a command separator. Use one of these approaches instead:

```powershell
# Option 1: Run commands sequentially with ;
cd C:\Users\lenovo\Desktop\dev\deviedco; npm run dev

# Option 2: Use piping with semicolons
powershell -Command "cd C:\Users\lenovo\Desktop\dev\deviedco; npm run dev"
``` 