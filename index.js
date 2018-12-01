var express = require('express');
var bodyParser = require('body-parser');
var app = express();


app.use(bodyParser.json({type:'application/json'}));

var postgres = require('./lib/postgres');

function lookupPhoto(req, res, next){
        
        //Acessamos o Parametro ID no objeto de solicitação 
        var photoId = req.params.id;
        
        //construa uma consulta SQL para selecionar o objeto de recurso por ID
        var sql = 'SELECT * FROM photo WHERE id = $1';
        postgres.client.query (sql, [photoId], function(err,results){
                if(err){
                        console.error (err);
                        res.statusCode=500;
                        return res.json ({erros:['NAO FOI POSSIVEL RECUPERAR A FOTO']});
                }
        //nunhum resultado encontrado significa que o objeto não foi encontrado
        if(results.rows.length===0){
                //podemos definir o codigo de status HTTP no objeto res
                res.statusCode = 404;
                return res.json({erros:['FOTO NAO ENCONTRADA']});
        }
        
        //anexando uma propriedade de foto ao pedido
        //seus dados são disponibilizados em nossa função de manipulador
        req.photo = results.rows [0];
        next();
        });
}

          //cria o objeto do roteador expresso para o FOTOS
          var photoRouter=express.Router();
          //um GET para a raiz de um recurso retorna a lista desse recurso
          photoRouter.get('/',function(req,res){});
          //um POST para a raiz de um recurso pode criar um novo objeto
          photoRouter.post('/',function(req,res){
                var sql = 'INSERT INTO photo (description, filepath, album_id) VALUES ($1, $2, $3) RETURNING id';
                //recupere os daddos para inserir do corpr do POST
                var data = [
                        req.body.descrition,
                        req.body.filepath,
                        req.body.album_id
                ];
                postgres.client.query(sql, data, function(err, result){
                        if(err){
                                console.erro(err);
                                res.statusCode = 500;
                                return res.jason({
                                        errors:['FALHA AO CRIAR FOTO']
                                });
                        }
                        var newPhotoId = result.rows[0].id;
                        var sql = 'SELECT * FROM photo WERE id = $1';
                        postgres.client.query(sql, [newPhotoId], function(err,result){
                                if(err){
                                //protegemos nossos clientes de erros internos, mas registrmos eles
                                        console.error(err);
                                        res.statusCode = 500;
                                        return res.json({
                                                error:['NAO FOI POSSIVEL RECUPERAR FOTO ']
                                        });
                                
                                }
                                //solicitação criou um novo objeto de recurso
                                res.statusCode = 201;
                                //O resultado de CREATE deve ser o mesmo que GET
                                res.json(result.rows[0]);
                                
                        });
                });
                
          });
          //especificamos um parametro em nosso caminho para o GET de um objeto especifico
          photoRouter.get('/:id', lookupPhoto, function(req,res){
                res.json(req.photo);
          
          });
          //similar ao GET em um objeto, para utilizalo, usamos o PATH
          photoRouter.patch('/:id', lookupPhoto,  function(req,res){});         
          //excluir um objeto especifico
          photoRouter.delete('/:id', lookupPhoto, function(req,res){});
          //anexa os roteadores para os seus respectivos caminhos
          app.use('/photo',photoRouter);
          
          
          
          var albumRouter = express.Router();
          albumRouter.get('/',function(req,res){});
          albumRouter.post('/',function(req,res){});
          albumRouter.get('/:id',function(req,res){});
          albumRouter.patch('/:id',function(req,res){});
          albumRouter.delete('/:id',function(req,res){});
          app.use('/album',albumRouter);

app.get('/', function(req, res){
        res.end();
});
          
module.exports = app;
