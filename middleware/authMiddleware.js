import jwt from "jsonwebtoken";
import Veterinario from "../models/Veterinarios.js";

const checkAuth = async ( req, res, next ) => {
     let token;
     if ( req.headers.authorization && req.headers.authorization.startsWith('Bearer') ) {
          console.log('si tiene el token con bearer');
     }
     try {
          token = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          req.veterinario = await Veterinario.findById(decoded.id).select(
               '-password -token -confirmado'
          );
          return next();

     } catch (error) {
          
          const er = new Error('token no Válido');
          return res.status(403).json({ msj: er.message });
     }

     if (!token) {
          const error = new Error('token no Válido e inexistente');
          res.status(403).json({ msj: error.message });
     }              
     
     next();
}

export default checkAuth;