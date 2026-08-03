<?php

namespace App\Http\Controllers\Api;
use Illuminate\Validation\Rules\Password;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\User;
use App\Models\ActivityLog;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class AuthController extends Controller
{
    // function to register simple user at first, to be hidden for external users soon

    public function registerUser(Request $request){
        // validate and sanitize input
       $data  = Validator::make($request->all(),[
                    'name' =>'required|string|min:3|max:250',
                    'email'=>'required|email|unique:users,email',
                    'phone' =>'required|numeric|min:10',
                    'password' => ['required',Password::min(8)
                                    ->mixedCase()
                                    ->numbers()
                                    ->symbols(),],
        ]);
        if($data->fails()){
            return response()->json(['message'=> $data->errors()],400);
        }
        $userpassword = Hash::make($request->get('password'));
        $user = User::create([
            'name' => $request->get('name'),
            'email' => $request->get('email'),
            'password' => $userpassword,
            'phone' => $request->get('phone'),
            // public self-registration can never grant elevated roles
            'role'=>'member',

        ]);
        ActivityLog::record('user.registered', $user, "{$user->name} self-registered", null, $user->id);
        $token = JWTAuth::fromUser($user);
        return response()->json(['message'=>'User registered successfully', 'data'=>$user, 'token'=>$token],200);
    
    }
    // login user here and preserve his token for later access to tasks and boards
    public function loginUser(Request $request){
     $credentials = $request->only('email','password');

    //  now let's try to check if the user has token access using JWT
    try {
        
        if(! $token = JWTAuth::attempt($credentials)){
            return response()->json(['error' => 'Invalid credentials'],400);
        }

    } catch (JWTException $error) {
        return response()->json(['error'=>'could not create token'],500);
    }
    return response()->json([
        'message'=>"Login Successfully",
        'data' => auth()->user(),
        "token"=>$token,
    ],200);
    }
    // let's verify if JWT security is enabled by getting logged in user information using JWT
public function getuserinfo(){
    return response()->json(['data' => auth()->user()],200);
}

// let the logged-in user edit their own name/email/phone, and optionally
// change their password (requires confirming their current one first)
public function updateProfile(Request $request){
    $user = auth()->user();

    $data = Validator::make($request->all(),[
        'name' => 'sometimes|required|string|min:3|max:250',
        'email' => 'sometimes|required|email|unique:users,email,'.$user->id,
        'phone' => 'sometimes|required|numeric|min:10',
        'current_password' => 'required_with:password',
        'password' => ['sometimes','confirmed',Password::min(8)
                        ->mixedCase()
                        ->numbers()
                        ->symbols(),],
    ]);
    if($data->fails()){
        return response()->json(['message'=>$data->errors()],400);
    }

    $validated = $data->validated();

    if ($request->filled('password')) {
        if (!Hash::check($request->get('current_password'), $user->password)) {
            return response()->json(['message'=>['current_password'=>['The current password is incorrect.']]],400);
        }
        $validated['password'] = Hash::make($validated['password']);
    }
    unset($validated['current_password']);

    $user->update($validated);
    ActivityLog::record('user.profile_updated', $user, "{$user->name} updated their own profile");

    return response()->json(['message'=>'profile updated','data'=>$user],200);
}

// let's log user out and see if our token expired
public function logUserOut(){
    auth()->logout();
    return response()->json(['message'=>"logout out successfully"]);
}

}
