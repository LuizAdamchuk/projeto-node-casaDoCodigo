const uuid = require('uuid/v4');
const sessao = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const UsuarioDao = require('../app/infra/usuario-dao');
const db = require('./database');

module.exports = (app) => {

    // configuração da sessão e da autenticação.
    passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'senha'
        },
        (email, senha, done) => {
            const usuarioDao = new UsuarioDao(db);
            usuarioDao.buscaPorEmail(email)
                .then(usuario => {
                    if (!usuario || senha != usuario.senha) {
                        return done(null, false, {
                            mensagem: 'Login e senha incorretos!'
                        });
                    }

                    return done(null, usuario);
                })
                .catch(erro => done(erro, false));
        }
    ));
    // determina qual dados será armazenado na sessão
    passport.serializeUser((usuario, done) => {
        const usuarioSessao = {
            nome: usuario.nome_completo,
            email: usuario.email
        };

        done(null, usuarioSessao);
    });
    // através da key(1arg) busca no database o usuario
    passport.deserializeUser((usuarioSessao, done) => {
        done(null, usuarioSessao);
    });

    app.use(sessao({
        secret: 'node alura',
        genid: function (req) {
            return uuid();
        },
        resave: false,
        saveUninitialized: false
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    // aqui estou fazendo um injeção de dependencia e usando em base-controlador.js
    app.use(function (req, resp, next) {
        req.passport = passport;
        next();
    });
};