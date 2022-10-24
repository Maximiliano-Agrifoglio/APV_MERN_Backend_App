import Veterinario from "../models/Veterinarios.js";
import generarJWT from "../helpers/generarJWT.js";
import generarID from "../helpers/generarid.js";
import emailRegistro from "../helpers/emailRegistro.js";
import emailOlvidePassword from "../helpers/emailOlvidePassword.js";

const registrar = async (req, res) => {
    const { email, nombre } = req.body;

    // prevenir usuarios duplicados
    const existeUsuario = await Veterinario.findOne({ email }); 

    if (existeUsuario) {
        const error = new Error("usuario ya registrado..");
        return res.status(400).json({msj: error.message});
    }           

    try {
        const veterinario = new Veterinario(req.body); 
        const veterinarioGuardado = await veterinario.save(); 

        //Enviar el email.
        emailRegistro({
            email,
            nombre,
            token: veterinarioGuardado.token
        })

        res.json( veterinarioGuardado );
    } catch (error) {
        console.log(error)
    }
}    

const perfil = (req, res) => {
    const { veterinario } = req;
    res.json( veterinario );
}

const confirmar = async (req, res) => {
    const { token } = req.params
    try {
        const usuarioConfirmar = await Veterinario.findOne({token});

        if (!usuarioConfirmar) {
            const error = new Error('token no válido');
            return res.status(404).json({ msj: error.message });
        }  
        usuarioConfirmar.token = null;
        usuarioConfirmar.confirmado = true;
        await usuarioConfirmar.save();     
        res.json({ msj: 'usuario confirmado correctamente...'});
    } catch (error) {
       console.log(error) 
    }
}

const autenticar = async (req, res) => {
    const { email, password } = req.body;

    //comprobar si el usuario existe.
    const usuario = await Veterinario.findOne({ email });

    if (!usuario) {
        const error = new Error('el usuario no existe');
        return res.status(404).json({msj: error.message});
    }
    
    //Comprobar si el usuario esta confirmado...
    if(!usuario.confirmado){
        const error = new Error('tu cuenta no esta confirmada!.');
        return res.status(404).json({msj: error.message});
    }
    // revisar su password. 
    if ( await usuario.comprobarPassword(password) ) {
         //Autenticar JWT
         res.json({ 
            _id: usuario._id,
            nombre: usuario.nombre,
            email: usuario.email,
            token: generarJWT(usuario.id),
            telefono: usuario.telefono,
            web: usuario.web
         });
        
    }else{
        const error = new Error('password incorrecto...');
        return res.status(404).json({msj: error.message});
    }
}

const olvidePassword = async (req, res) => {
     const { email } = req.body;
     try {
         const existeVeterinario = await Veterinario.findOne({ email });
         if (!existeVeterinario) {
            const error = new Error('El Usuario no existe');
            return res.status(400).json({ msj: error.message });
         }
         existeVeterinario.token = generarID();
         await existeVeterinario.save();

         //enviar email con las instrucciones.
         emailOlvidePassword({
            email,
            nombre: existeVeterinario.nombre,
            token: existeVeterinario.token
         })
         res.json({ msj:'hemos enviado un email con las instrucciones' });

     } catch (error) {
        console.log(error);
     }
}
const comprobarToken = async (req, res) => { 
    const { token } = req.params;

    const tokenValido = await Veterinario.findOne({ token });
    if (tokenValido) {
        //el token es valido el usuario existe...
        res.json({msj: 'token valido y el usuario existe...'});
    } else {
        const error = new Error('token no valido');
        return res.status(400).json({ msj: error.message });
    }
}
const nuevoPassword = async (req, res) => { 
    const { token } = req.params;
    const { password } = req.body;
    try {
        const veterinario = await Veterinario.findOne({ token });
        if (!veterinario) {
            const error = new Error('hubo un error');
            return res.status(400).json({ msj: error.message });
        }
        veterinario.token = null;
        veterinario.password = password;
        await veterinario.save();
        res.json({msj: 'password modificado correctamente.'});
        
    } catch (error) {
        console.log(error);
    }
}

const actualizarPerfil = async (req, res) => {

    const veterinario = await Veterinario.findById(req.params.id);

    if(!veterinario) {
        const error = new Error('Hubo un error');
        return res.status(400).json({ msj: error.message});
    }

    const {email} = req.body;
    if (veterinario.email !== req.body.email) {
        const existeEmail = await Veterinario.findOne({email});
        if (existeEmail) {
            const error = new Error('Ese Email ya esta en uso');
            return res.status(400).json({ msj: error.message});
        }
    }

    try {
        veterinario.nombre = req.body.nombre;
        veterinario.email = req.body.email;
        veterinario.web = req.body.web;
        veterinario.telefono = req.body.telefono;

        const veterinarioActualizado = await veterinario.save();
        res.json(veterinarioActualizado);
    } catch (error) {
        console.log(error);
    }
}

const actualizarPassword = async (req, res) => {
    //Leer los datos.
    const {id} = req.veterinario
    const {pwd_actual, pwd_nuevo} = req.body

    //comprobar que el veterinario existe.
    const veterinario = await Veterinario.findById(id);
    if(!veterinario) {
        const error = new Error('Hubo un error');
        return res.status(400).json({ msj: error.message});
    }

    //Comprobar Password.
    if (await veterinario.comprobarPassword(pwd_actual)) {
        //Almacenara el nuevo password.
        veterinario.password = pwd_nuevo;
        await veterinario.save();
        res.json({msj: 'Password Almacenado Correctamente'});
    }else{
        const error = new Error('El Password Actual es Incorrecto');
        return res.status(400).json({ msj: error.message});
    }
}

export {
    registrar,
    perfil,
    confirmar,
    autenticar,
    olvidePassword,
    comprobarToken,
    nuevoPassword,
    actualizarPerfil,
    actualizarPassword
}

         

