const prompt=String(process.argv[2]??"").toLowerCase();
if(prompt.includes("username"))process.stdout.write("x-access-token");
else if(prompt.includes("password")){const token=process.env.HARDWARE_RADAR_GITHUB_INSTALLATION_TOKEN_EPHEMERAL;if(!token)process.exit(1);process.stdout.write(token);}
else process.exit(1);
