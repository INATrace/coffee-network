import * as express from "express";
import * as jwt from "jsonwebtoken";
// import * as cookieParser from "cookie-parser";
// import cookieParser = require('cookie-parser')

export function expressAuthentication(
    request: express.Request,
    securityName: string,
    scopes?: string[]
): Promise<any> {

    if (securityName === "jwt") {
        // const token =
        //   request.body.token ||
        //   request.query.token ||
        //   request.headers["x-access-token"];


        return new Promise((resolve, reject) => {
            const token = request.cookies[process.env.JWT_TOKEN_NAME]
            // console.log("TOKEN:", token)
            if (!token) {
                reject(new Error("No token provided"));
            }
            jwt.verify(token, process.env.JWT_SIGNING_KEY, (err: any, decoded: any) => {
                if (err) {
                    // console.log("XXXX-ERR", err)
                    reject(err);
                } else {
                    // Check if JWT contains all required scopes
                    //   for (const scope of scopes) {
                    //     if (!decoded.scopes.includes(scope)) {
                    //       reject(new Error("JWT does not contain required scope."));
                    //     }
                    //   }
                    if (scopes && scopes.length > 0) {
                        if (scopes.indexOf(decoded.rle) < 0) {
                            const err2 = new Error(`Access denied: required roles ${ scopes }. Provided '${ decoded.rle }'.`);
                            (err2 as any).status = "403";
                            reject(err2);
                            return;
                        }
                    }
                    // console.log("OK - DELA", decoded, scopes, scopes.indexOf(decoded.rle))
                    resolve(decoded);
                }
            });
        });
    }
}